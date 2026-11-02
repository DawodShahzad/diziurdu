import { CastMember, Show } from '../types';

export type RoleType = 'lead' | 'supporting' | 'minor';

export interface ActorAppearance {
  show: Show;
  character: string;
  order: number;
  roleType: RoleType;
  roleLabel: string; // 'Main Lead' | 'Supporting Lead' | 'Recurring / Guest'
}

export interface IndexedActor {
  id: string;
  name: string;
  profileUrl: string;
  tmdbId?: number;
  biography?: string;
  birthYear?: string;
  appearances: ActorAppearance[];
  totalShows: number;
  leadShows: ActorAppearance[];
  supportingShows: ActorAppearance[];
  minorShows: ActorAppearance[];
  primaryGenres: string[];
  prominenceScore: number;
}

/**
 * Standardizes actor identification slug from name / id / tmdbId
 */
export function normalizeActorKey(name: string, id?: string, tmdbId?: number): string {
  if (tmdbId) return `tmdb-${tmdbId}`;
  const base = (name || id || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  return base || 'unknown-actor';
}

/**
 * Categorizes billing order into role tier
 * 0-1 = Main Lead, 2-4 = Supporting Lead, 5+ = Recurring / Minor
 */
export function getRoleType(order?: number): { roleType: RoleType; roleLabel: string } {
  const ord = order !== undefined ? order : 0;
  if (ord <= 1) {
    return { roleType: 'lead', roleLabel: 'Main Lead' };
  }
  if (ord <= 4) {
    return { roleType: 'supporting', roleLabel: 'Supporting Lead' };
  }
  return { roleType: 'minor', roleLabel: 'Recurring / Guest' };
}

/**
 * REAL-TIME CLIENT-SIDE RELATIONAL ACTOR INDEXING ENGINE
 * 
 * Automatically recalculates actor appearances, filmographies, and role weights
 * whenever the catalog updates, without requiring any backend.
 */
export function buildActorIndex(shows: Show[]): Map<string, IndexedActor> {
  const actorMap = new Map<string, IndexedActor>();
  const catalog = shows || [];

  for (const show of catalog) {
    if (!show.cast || !Array.isArray(show.cast)) continue;

    show.cast.forEach((c, index) => {
      if (!c.name || !c.name.trim()) return;

      const key = normalizeActorKey(c.name, c.id, c.tmdbId);
      const effectiveOrder = c.order !== undefined ? c.order : index;
      const { roleType, roleLabel } = getRoleType(effectiveOrder);

      const appearance: ActorAppearance = {
        show,
        character: c.character || 'Cast',
        order: effectiveOrder,
        roleType,
        roleLabel
      };

      if (!actorMap.has(key)) {
        actorMap.set(key, {
          id: c.id || key,
          name: c.name.trim(),
          profileUrl: c.profileUrl || '',
          tmdbId: c.tmdbId,
          biography: c.biography,
          birthYear: c.birthYear,
          appearances: [appearance],
          totalShows: 1,
          leadShows: roleType === 'lead' ? [appearance] : [],
          supportingShows: roleType === 'supporting' ? [appearance] : [],
          minorShows: roleType === 'minor' ? [appearance] : [],
          primaryGenres: [...(show.genres || [])],
          prominenceScore: roleType === 'lead' ? 10 : roleType === 'supporting' ? 4 : 1
        });
      } else {
        const existing = actorMap.get(key)!;
        // Avoid duplicate appearance in same show
        if (!existing.appearances.some((a) => a.show.id === show.id)) {
          existing.appearances.push(appearance);
          existing.totalShows += 1;

          if (roleType === 'lead') {
            existing.leadShows.push(appearance);
            existing.prominenceScore += 10;
          } else if (roleType === 'supporting') {
            existing.supportingShows.push(appearance);
            existing.prominenceScore += 4;
          } else {
            existing.minorShows.push(appearance);
            existing.prominenceScore += 1;
          }

          if (!existing.profileUrl && c.profileUrl) {
            existing.profileUrl = c.profileUrl;
          }
          if (!existing.biography && c.biography) {
            existing.biography = c.biography;
          }

          // Merge genres
          (show.genres || []).forEach((g) => {
            if (!existing.primaryGenres.includes(g)) {
              existing.primaryGenres.push(g);
            }
          });
        }
      }
    });
  }

  // Sort each actor's appearances:
  // 1. Main Lead roles first
  // 2. Supporting roles next
  // 3. Minor / recurring roles last
  // Within the same tier, sort by show points or release year
  actorMap.forEach((actor) => {
    actor.appearances.sort((a, b) => {
      if (a.order !== b.order) {
        return a.order - b.order;
      }
      const scoreA = a.show.all_time_score || a.show.points || 0;
      const scoreB = b.show.all_time_score || b.show.points || 0;
      return scoreB - scoreA;
    });

    // Add show quality boost to prominence score
    actor.prominenceScore += Math.min(20, Math.floor(actor.totalShows * 2));
  });

  return actorMap;
}

/**
 * Returns an actor's complete filmography across all shows & movies,
 * prioritizing their lead works first.
 */
export function getActorFilmography(
  actor: CastMember | string,
  shows: Show[]
): ActorAppearance[] {
  const actorName = typeof actor === 'string' ? actor : actor.name;
  const actorId = typeof actor === 'string' ? undefined : actor.id;
  const tmdbId = typeof actor === 'string' ? undefined : actor.tmdbId;

  const key = normalizeActorKey(actorName, actorId, tmdbId);
  const index = buildActorIndex(shows);
  const record = index.get(key);

  if (record) {
    return record.appearances;
  }

  // Fallback direct scan
  const normalizedTarget = actorName.toLowerCase().trim();
  const directAppearances: ActorAppearance[] = [];

  for (const s of shows) {
    const foundIndex = (s.cast || []).findIndex(
      (c) =>
        (actorId && c.id === actorId) ||
        (tmdbId && c.tmdbId === tmdbId) ||
        c.name.toLowerCase().trim() === normalizedTarget
    );

    if (foundIndex !== -1) {
      const c = s.cast[foundIndex];
      const ord = c.order !== undefined ? c.order : foundIndex;
      const { roleType, roleLabel } = getRoleType(ord);
      directAppearances.push({
        show: s,
        character: c.character || 'Cast',
        order: ord,
        roleType,
        roleLabel
      });
    }
  }

  directAppearances.sort((a, b) => a.order - b.order);
  return directAppearances;
}

/**
 * Finds all related shows that share actors with a given show,
 * weighting shared leads (10pts), shared supporting actors (4pts), and recurring (1pt).
 */
export function getRelatedShowsBySharedCast(targetShow: Show, allShows: Show[]): Show[] {
  if (!targetShow.cast || targetShow.cast.length === 0) return [];

  const targetActorKeys = new Map<string, number>();
  targetShow.cast.forEach((c, idx) => {
    const key = normalizeActorKey(c.name, c.id, c.tmdbId);
    const ord = c.order !== undefined ? c.order : idx;
    targetActorKeys.set(key, ord <= 1 ? 10 : ord <= 4 ? 4 : 1);
  });

  const scoredShows: { show: Show; score: number }[] = [];

  for (const s of allShows) {
    if (s.id === targetShow.id) continue;
    let overlapScore = 0;

    for (let i = 0; i < (s.cast || []).length; i++) {
      const otherC = s.cast[i];
      const otherKey = normalizeActorKey(otherC.name, otherC.id, otherC.tmdbId);
      if (targetActorKeys.has(otherKey)) {
        const baseWeight = targetActorKeys.get(otherKey)!;
        const otherOrd = otherC.order !== undefined ? otherC.order : i;
        const otherWeight = otherOrd <= 1 ? 10 : otherOrd <= 4 ? 4 : 1;
        overlapScore += baseWeight * 0.6 + otherWeight * 0.4;
      }
    }

    if (overlapScore > 0) {
      scoredShows.push({ show: s, score: overlapScore });
    }
  }

  scoredShows.sort((a, b) => b.score - a.score);
  return scoredShows.map((item) => item.show);
}
