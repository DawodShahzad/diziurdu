import { Show, FeedConfig, AdminSettings } from '../types';
import dramasData from './dramas.json';
import fullBackupData from './full_backup.json';

export const INITIAL_SHOWS: Show[] = (
  Array.isArray(dramasData) && dramasData.length > 0
    ? (dramasData as unknown as Show[])
    : (fullBackupData && Array.isArray((fullBackupData as any).shows) && (fullBackupData as any).shows.length > 0)
    ? ((fullBackupData as any).shows as Show[])
    : []
);

const _LEGACY_SHOWS: Show[] = [
  {
    id: 'dirilis-ertugrul',
    title: 'Diriliş: Ertuğrul',
    turkishTitle: 'Resurrection: Ertuğrul',
    type: 'series',
    backdropUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=1920&q=80',
    posterLandscapeUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=1280&q=80',
    logoText: 'DİRİLİŞ',
    logoSubtext: 'ERTUĞRUL',
    synopsis:
      'In 13th-century Anatolia, Ertuğrul Gazi, the heroic leader of the Kayı tribe of Oghuz Turks, valiantly battles against the Knights Templar, Mongol hordes, and treasonous Byzantine governors. Guided by honor, faith, and strategic brotherhood, his legendary quest lays the spiritual and martial foundations of the six-century Ottoman Empire.',
    shortDescription:
      'A brave 13th-century warrior battles crusaders and Mongols to forge a home for his tribe, sparking the birth of a glorious empire.',
    ambientColor: '#d97706', // warm fiery gold / amber
    ambientGlowRgb: '217, 119, 6',
    trailerUrl: 'https://vjs.zencdn.net/v/oceans.mp4',
    releaseYear: '2014 - 2019',
    maturityRating: '16+',
    maturityDetails: 'violence, historical combat, warfare, martial peril, mild language',
    matchScore: 99,
    imdbRating: 9.2,
    durationOrSeasons: '5 Seasons',
    genres: ['Historical Epic', 'Action', 'War Drama', 'Bingey Thriller'],
    thisSeriesIs: ['Epic', 'Inspiring', 'Action-packed', 'Emotional'],
    qualityBadges: ['4K Ultra HD', 'HDR10'],
    points: 4820,
    trailersAndMore: [
      {
        id: 'ertugrul-trailer-s1',
        title: 'Season 1 Official 4K Trailer: Diriliş',
        thumbnailUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=640&q=80',
        videoUrl: 'https://vjs.zencdn.net/v/oceans.mp4',
        duration: '2m 14s'
      },
      {
        id: 'ertugrul-trailer-s2',
        title: 'Season 2 Trailer: The Mongol Storm',
        thumbnailUrl: 'https://images.unsplash.com/photo-1514539079130-25950c84af65?auto=format&fit=crop&w=640&q=80',
        videoUrl: 'https://vjs.zencdn.net/v/oceans.mp4',
        duration: '1m 58s'
      },
      {
        id: 'ertugrul-recap-s1',
        title: 'Season 1 Epic Recap: Rise of the Kayı',
        thumbnailUrl: 'https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=640&q=80',
        videoUrl: 'https://vjs.zencdn.net/v/oceans.mp4',
        duration: '3m 42s'
      },
      {
        id: 'ertugrul-teaser-clash',
        title: 'Battle of Aleppo: Special Behind-the-Scenes Clip',
        thumbnailUrl: 'https://images.unsplash.com/photo-1533158326339-7f3cf2404354?auto=format&fit=crop&w=640&q=80',
        videoUrl: 'https://vjs.zencdn.net/v/oceans.mp4',
        duration: '1m 30s'
      }
    ],
    cast: [
      {
        id: 'engin-altan',
        name: 'Engin Altan Düzyatan',
        character: 'Ertuğrul Bey',
        profileUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
        tmdbId: 1254890,
        birthYear: '1979, Karşıyaka, İzmir',
        biography:
          'Turkish film and television actor renowned internationally for his commanding titular performance as Ertuğrul Gazi in Diriliş: Ertuğrul, which garnered global acclaim across 75+ nations.'
      },
      {
        id: 'esra-bilgic',
        name: 'Esra Bilgiç',
        character: 'Halime Sultan',
        profileUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
        tmdbId: 1530944,
        birthYear: '1992, Ankara',
        biography:
          'Turkish actress celebrated for portraying the graceful yet courageous Seljuk princess Halime Sultan, mother of Osman I.'
      },
      {
        id: 'cengiz-coskun',
        name: 'Cengiz Coşkun',
        character: 'Turgut Alp',
        profileUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
        tmdbId: 1098411,
        birthYear: '1982, Istanbul',
        biography:
          'Famed for his ferocious battle axe combat scenes and unwavering loyalty as Ertuğrul’s legendary blood-brother Turgut Alp.'
      },
      {
        id: 'nurettin-sonmez',
        name: 'Nurettin Sönmez',
        character: 'Bamsı Beyrek',
        profileUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&q=80',
        tmdbId: 1530948,
        birthYear: '1978, Istanbul',
        biography:
          'Actor and martial artist famed for dual-sword combat and the charismatic, warm-hearted warrior Bamsı Beyrek.'
      }
    ],
    seasons: [
      {
        seasonNumber: 1,
        title: 'Season 1: The Templar Conspiracy',
        episodes: [
          {
            id: 'ertugrul-s1-e1',
            seasonNumber: 1,
            episodeNumber: 1,
            title: 'Episode 1: The Hunt and the Prisoner',
            subheading: 'The Rescue in the Forest',
            duration: '48m',
            thumbnailUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=640&q=80',
            synopsis:
              'While hunting in the forest, Ertuğrul rescues three captive Seljuk nobles from the Knights Templar, inadvertently bringing dangerous enemies upon his tribe.',
            videoUrl: 'https://vjs.zencdn.net/v/oceans.mp4',
            releaseDate: 'Dec 10, 2014'
          },
          {
            id: 'ertugrul-s1-e2',
            seasonNumber: 1,
            episodeNumber: 2,
            title: 'Episode 2: Council of the Elders',
            subheading: 'Betrayal at Aleppo Gate',
            duration: '52m',
            thumbnailUrl: 'https://images.unsplash.com/photo-1533158326339-7f3cf2404354?auto=format&fit=crop&w=640&q=80',
            synopsis:
              'Süleyman Şah gathers the tribal council to deliberate winter migration. Internal betrayal brews as Kurdoğlu secretively plots with Aleppo emissaries.',
            videoUrl: 'https://vjs.zencdn.net/v/oceans.mp4',
            releaseDate: 'Dec 17, 2014'
          },
          {
            id: 'ertugrul-s1-e3',
            seasonNumber: 1,
            episodeNumber: 3,
            title: 'Episode 3: Ambush in the Gorge',
            duration: '54m',
            thumbnailUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=640&q=80',
            synopsis:
              'Titus vows blood vengeance against Ertuğrul for his fallen brother. A deadly ambush in the rocky mountain pass tests the resilience of the Alps.',
            videoUrl: 'https://vjs.zencdn.net/v/oceans.mp4',
            releaseDate: 'Dec 24, 2014'
          },
          {
            id: 'ertugrul-s1-e4',
            seasonNumber: 1,
            episodeNumber: 4,
            title: 'Episode 4: The Fortress of Shadows',
            duration: '50m',
            thumbnailUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=640&q=80',
            synopsis:
              'Infiltrating the crusader fortress disguised as merchants, Ertuğrul and his Alps search for the secret parchment that will clear their tribe’s honor.',
            videoUrl: 'https://vjs.zencdn.net/v/oceans.mp4',
            releaseDate: 'Dec 31, 2014'
          }
        ]
      },
      {
        seasonNumber: 2,
        title: 'Season 2: The Mongol Reckoning',
        episodes: [
          {
            id: 'ertugrul-s2-e1',
            seasonNumber: 2,
            episodeNumber: 1,
            title: 'Episode 1: The Wrath of Noyan',
            duration: '55m',
            thumbnailUrl: 'https://images.unsplash.com/photo-1514539079130-25950c84af65?auto=format&fit=crop&w=640&q=80',
            synopsis:
              'The ruthless Mongol commander Baiju Noyan descends upon Anatolia with iron fury, leaving devastation in his path as the Kayı tribe faces exile.',
            videoUrl: 'https://vjs.zencdn.net/v/oceans.mp4',
            releaseDate: 'Sep 30, 2015'
          },
          {
            id: 'ertugrul-s2-e2',
            seasonNumber: 2,
            episodeNumber: 2,
            title: 'Episode 2: Unyielding Spirit',
            duration: '51m',
            thumbnailUrl: 'https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=640&q=80',
            synopsis:
              'Captured and tortured by Noyan’s soldiers, Ertuğrul’s unbending faith keeps his comrades hopeful against seemingly insurmountable odds.',
            videoUrl: 'https://vjs.zencdn.net/v/oceans.mp4',
            releaseDate: 'Oct 7, 2015'
          }
        ]
      }
    ],
    whereToWatch: [
      {
        provider: 'youtube',
        name: 'Watch on YouTube',
        url: 'https://www.youtube.com/results?search_query=dirilis+ertugrul+official',
        iconType: 'youtube',
        freeOrSub: 'Official Channel'
      },
      {
        provider: 'netflix',
        name: 'Watch on Netflix',
        url: 'https://www.netflix.com/title/80127001',
        iconType: 'netflix',
        freeOrSub: 'Subscription'
      },
      {
        provider: 'tabii',
        name: 'Watch on Tabii',
        url: 'https://www.tabii.com',
        iconType: 'tabii',
        freeOrSub: 'Free with Ads'
      }
    ],
    blog: {
      heading: 'The Global Phenomenon of Diriliş: Ertuğrul — Behind the Legend',
      publishedDate: 'October 2026',
      author: 'CineFlix Editorial Desk',
      readTime: '6 min read',
      heroImage: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=1200&q=80',
      sections: [
        {
          title: 'A Cinematic Masterpiece of Faith and Bravery',
          content:
            'When producer Mehmet Bozdağ envisioned Diriliş: Ertuğrul in 2014, Turkish television had never attempted historical worldbuilding at this scale. Filmed in custom-built fortress sets in Riva, Beykoz, the production brought hundreds of trained horses, authentic yurt tents, and hand-forged damascus steel weaponry to life. What began as a national epic rapidly transformed into a worldwide cultural milestone, streamed in over 85 countries and watched by an estimated 3 billion collective viewers worldwide.',
          quote: '“The path of honor is steep and narrow, but the one who walks it never walks alone.”'
        },
        {
          title: 'Engin Altan Düzyatan’s Magnetic Performance',
          content:
            'Engin Altan Düzyatan invested eight months in intensive equestrian archery, traditional swordplay, and ancient Seljuk history prior to shooting. His nuanced portrayal of Ertuğrul balances formidable martial prowess with deep spiritual serenity and family loyalty. The chemistry between Ertuğrul and his Alps (Turgut, Bamsı, and Doğan) established one of television history’s most memorable brotherhood dynamics.'
        },
        {
          title: 'Cultural Echoes Across Continents',
          content:
            'From the streets of Lahore to Istanbul, London, and Johannesburg, fans adopted the Kayı tribe blue flag (IYI) as an emblem of justice and perseverance. The majestic soundtrack composed by Alpay Göltekin and Zeynep Alasya continues to resonate as one of the most recognizable theme songs in modern streaming.'
        }
      ],
      trivia: [
        'Over 60 horses were trained exclusively for combat scenes across 6 months of stunt preparation.',
        'The main village set of the Kayı tribe spanned over 40,000 square meters with hand-woven wool carpets.',
        'Nelson Mandela’s grandson Nkosi Zwelivelile Mandela traveled to Turkey specifically to meet the cast.'
      ]
    }
  },
  {
    id: 'barbaroslar',
    title: "Barbaroslar: Akdeniz'in Kılıcı",
    turkishTitle: 'Barbaros: Sword of the Mediterranean',
    type: 'series',
    backdropUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1920&q=80',
    posterLandscapeUrl: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=1280&q=80',
    logoText: 'BARBAROSLAR',
    logoSubtext: "AKDENİZ'İN KILICI",
    synopsis:
      'The breathtaking high-seas saga of the four brothers — İshak, Oruç, Hızır, and İlyas — born on the island of Lesbos, who defy maritime empires, Venetian armadas, and corsairs to dominate the Mediterranean waves and write their names forever into naval history as the legendary Barbarossa captains.',
    shortDescription:
      'Four courageous brothers navigate treacherous waters and royal navies to establish supremacy across the golden Mediterranean.',
    ambientColor: '#0284c7', // deep maritime ocean blue
    ambientGlowRgb: '2, 132, 199',
    trailerUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
    releaseYear: '2021 - 2022',
    maturityRating: '16+',
    maturityDetails: 'violence, maritime battle, naval warfare, peril, mild language',
    matchScore: 94,
    imdbRating: 8.6,
    durationOrSeasons: '1 Season',
    genres: ['Maritime Epic', 'Action', 'Historical Fiction', 'Adventure'],
    thisSeriesIs: ['Spectacular', 'High-Seas', 'Adrenaline Rush', 'Heroic'],
    qualityBadges: ['4K Ultra HD', 'HDR10'],
    points: 3940,
    trailersAndMore: [
      {
        id: 'barbaros-trailer-s1',
        title: "Official 4K Maritime Trailer: Barbaroslar",
        thumbnailUrl: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=640&q=80',
        videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
        duration: '2m 05s'
      },
      {
        id: 'barbaros-recap-s1',
        title: "Battle of the Mediterranean: Behind the Scenes",
        thumbnailUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=640&q=80',
        videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
        duration: '2m 45s'
      }
    ],
    cast: [
      {
        id: 'engin-altan',
        name: 'Engin Altan Düzyatan',
        character: 'Oruç Reis (Baba Oruç)',
        profileUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
        tmdbId: 1254890,
        birthYear: '1979, Karşıyaka, İzmir',
        biography:
          'In Barbaroslar, Engin Altan returns as Oruç Reis, the fierce, one-armed legendary naval leader and protector of the oppressed on the Mediterranean.'
      },
      {
        id: 'ulas-tuna-astepe',
        name: 'Ulaş Tuna Astepe',
        character: 'Hızır Reis (Hayreddin Pasha)',
        profileUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80',
        tmdbId: 1984210,
        birthYear: '1988, İzmit',
        biography:
          'Gifted Turkish actor portraying Hızır Reis, the intellectual, strategic navigator who later becomes Grand Admiral Hayreddin Barbarossa.'
      },
      {
        id: 'yetkin-dikinciler',
        name: 'Yetkin Dikinciler',
        character: 'İshak Reis',
        profileUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=400&q=80',
        tmdbId: 98124,
        birthYear: '1969, Istanbul',
        biography:
          'Veteran actor playing the eldest brother İshak Reis, balancing commerce with family loyalty amidst Mediterranean storms.'
      },
      {
        id: 'pelin-akil',
        name: 'Pelin Akil',
        character: 'İsabel',
        profileUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
        tmdbId: 1450211,
        birthYear: '1986, Istanbul',
        biography:
          'Playing the Venetian innkeeper and intelligence broker İsabel, torn between commerce and deep affections for Oruç.'
      }
    ],
    seasons: [
      {
        seasonNumber: 1,
        title: 'Season 1: Mediterranean Rising',
        episodes: [
          {
            id: 'barbaros-s1-e1',
            seasonNumber: 1,
            episodeNumber: 1,
            title: 'Episode 1: The Blood of Lesbos',
            duration: '52m',
            thumbnailUrl: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=640&q=80',
            synopsis:
              'Returning from a perilous trading voyage, Oruç and İlyas face merchant corsairs. In Alexandria, a secretive book holds the coordinates to lost maritime routes.',
            videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
            releaseDate: 'Sep 16, 2021'
          },
          {
            id: 'barbaros-s1-e2',
            seasonNumber: 1,
            episodeNumber: 2,
            title: 'Episode 2: Fire on the Waters',
            duration: '49m',
            thumbnailUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=640&q=80',
            synopsis:
              'A Venetian naval detachment ambushes Oruç’s ship. Hızır relies on celestial navigation and daring maneuvers to execute a counter-offensive.',
            videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
            releaseDate: 'Sep 23, 2021'
          },
          {
            id: 'barbaros-s1-e3',
            seasonNumber: 1,
            episodeNumber: 3,
            title: 'Episode 3: The Fortress of Modon',
            duration: '53m',
            thumbnailUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=640&q=80',
            synopsis:
              'To rescue captive Muslim refugees from Andalusia, Oruç plots a daring night assault on the coastal citadel guarded by Genoese cannons.',
            videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
            releaseDate: 'Sep 30, 2021'
          }
        ]
      }
    ],
    whereToWatch: [
      {
        provider: 'youtube',
        name: 'Watch on YouTube',
        url: 'https://www.youtube.com/results?search_query=barbaroslar+akdenizin+kilici',
        iconType: 'youtube',
        freeOrSub: 'Official Channel'
      },
      {
        provider: 'tabii',
        name: 'Watch on Tabii',
        url: 'https://www.tabii.com',
        iconType: 'tabii',
        freeOrSub: 'Free with Ads'
      }
    ],
    blog: {
      heading: 'High-Seas Cinema: How Barbaroslar Rebuilt 16th-Century Maritime Warfare',
      publishedDate: 'September 2026',
      author: 'CineFlix Naval Historian',
      readTime: '5 min read',
      heroImage: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=1200&q=80',
      sections: [
        {
          title: 'Full-Scale Galleons in Mediterranean Studios',
          content:
            'To recreate the authentic feel of naval boarding actions and cannon broadsides, the production team constructed life-sized 16th-century Ottoman and Venetian galleons on mechanical hydraulic gimbals in Antalya. These multi-ton wooden ships could rock, pitch, and roll in synchronized rhythm with computer-controlled wave machines.',
          quote: '“He who controls the Mediterranean controls the destiny of continents.”'
        },
        {
          title: 'Engin Altan and Ulaş Tuna Astepe’s Dynamic',
          content:
            'The contrast between Engin Altan Düzyatan’s raw martial power as Oruç and Ulaş Tuna Astepe’s strategic, calculated acumen as Hızır provided genuine emotional heft to the sibling bonds. Their shared commitment to defending displaced Andalusian refugees grounds the thrilling action in real human history.'
        }
      ],
      trivia: [
        'The water tank used for the naval battles holds over 1.5 million liters of filtered seawater.',
        'Hollywood stunt coordinator Dusan Hyska directed the sword and boarding choreographies.'
      ]
    }
  },
  {
    id: 'aile',
    title: 'Aile',
    turkishTitle: 'The Family',
    type: 'series',
    backdropUrl: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=1920&q=80',
    posterLandscapeUrl: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=1280&q=80',
    logoText: 'AİLE',
    logoSubtext: 'THE FAMILY',
    synopsis:
      'When Aslan Soykan, the charismatic yet haunted leader of Istanbul’s most secretive crime syndicate, crosses paths on an airplane with Devin Akın, a brilliant independent psychologist, their magnetic attraction ignites a tempestuous romance. As their lives intertwine, both must navigate dysfunctional family trauma, underworld retribution, and the fragile line between healing and madness.',
    shortDescription:
      'A dangerous crime boss and an introspective psychologist fall into an obsessive love tested by toxic family dynasties and criminal chaos.',
    ambientColor: '#dc2626', // intense crimson noir
    ambientGlowRgb: '220, 38, 38',
    trailerUrl: 'https://vjs.zencdn.net/v/oceans.mp4',
    releaseYear: '2023 - 2024',
    maturityRating: '18+',
    maturityDetails: 'violence, substance use, suicide, language, psychological peril, domestic trauma',
    matchScore: 97,
    imdbRating: 8.8,
    durationOrSeasons: '2 Seasons',
    genres: ['Romantic Series', 'Bingey Thriller', 'Crime Drama', 'Psychological'],
    thisSeriesIs: ['Scandalous', 'Thought-provoking', 'Steamy', 'Intense'],
    qualityBadges: ['4K Ultra HD'],
    points: 4410,
    trailersAndMore: [
      {
        id: 'aile-trailer-s1',
        title: 'Official Season 1 4K Trailer: Aile',
        thumbnailUrl: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=640&q=80',
        videoUrl: 'https://vjs.zencdn.net/v/oceans.mp4',
        duration: '1m 52s'
      },
      {
        id: 'aile-trailer-s2',
        title: 'Season 2 Teaser: The Soykan Reckoning',
        thumbnailUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=640&q=80',
        videoUrl: 'https://vjs.zencdn.net/v/oceans.mp4',
        duration: '2m 10s'
      }
    ],
    cast: [
      {
        id: 'kivanc-tatlitug',
        name: 'Kıvanç Tatlıtuğ',
        character: 'Aslan Soykan',
        profileUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
        tmdbId: 1087140,
        birthYear: '1983, Adana',
        biography:
          'One of Turkey’s most renowned and versatile leading men, Kıvanç Tatlıtuğ delivers a powerhouse, multi-award-winning performance as Aslan Soykan in Aile and Muzaffer in The Butterfly’s Dream.'
      },
      {
        id: 'serenay-sarikaya',
        name: 'Serenay Sarıkaya',
        character: 'Devin Akın',
        profileUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
        tmdbId: 1332821,
        birthYear: '1992, Ankara',
        biography:
          'Acclaimed Turkish actress and model playing psychologist Devin, bringing electric intensity and profound vulnerability to the screen.'
      },
      {
        id: 'nur-surer',
        name: 'Nur Sürer',
        character: 'Hülya Soykan',
        profileUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
        tmdbId: 104251,
        birthYear: '1954, Amasya',
        biography:
          'Legendary Turkish character actress portraying the formidable, controlling matriarch Hülya Soykan who reigns with an iron fist over the family estate.'
      },
      {
        id: 'nejat-isler',
        name: 'Nejat İşler',
        character: 'Cihan Soykan',
        profileUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&q=80',
        tmdbId: 82514,
        birthYear: '1972, Istanbul',
        biography:
          'Critically acclaimed Turkish actor portraying Aslan’s estranged, deeply troubled older brother Cihan Soykan.'
      }
    ],
    seasons: [
      {
        seasonNumber: 1,
        title: 'Season 1: Blood and Therapy',
        episodes: [
          {
            id: 'aile-s1-e1',
            seasonNumber: 1,
            episodeNumber: 1,
            title: 'Episode 1: The Flight to Izmir',
            duration: '50m',
            thumbnailUrl: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=640&q=80',
            synopsis:
              'A serendipitous encounter on a commercial flight connects Aslan and Devin. Neither anticipates that their wounded pasts mirror each other’s deepest secrets.',
            videoUrl: 'https://vjs.zencdn.net/v/oceans.mp4',
            releaseDate: 'Mar 7, 2023'
          },
          {
            id: 'aile-s1-e2',
            seasonNumber: 1,
            episodeNumber: 2,
            title: 'Episode 2: Dinner at the Soykan Villa',
            duration: '53m',
            thumbnailUrl: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=640&q=80',
            synopsis:
              'Devin attends Sunday family dinner at the imposing Soykan mansion, quickly discovering the suffocating psychological rules imposed by matriarch Hülya.',
            videoUrl: 'https://vjs.zencdn.net/v/oceans.mp4',
            releaseDate: 'Mar 14, 2023'
          },
          {
            id: 'aile-s1-e3',
            seasonNumber: 1,
            episodeNumber: 3,
            title: 'Episode 3: The Night Club Ambush',
            duration: '47m',
            thumbnailUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=640&q=80',
            synopsis:
              'An illegal nightclub deal spirals out of control. Aslan risks his life and reputation to shield Devin from underworld retaliations.',
            videoUrl: 'https://vjs.zencdn.net/v/oceans.mp4',
            releaseDate: 'Mar 21, 2023'
          }
        ]
      },
      {
        seasonNumber: 2,
        title: 'Season 2: Dynasty in Flames',
        episodes: [
          {
            id: 'aile-s2-e1',
            seasonNumber: 2,
            episodeNumber: 1,
            title: 'Episode 1: The Breaking Point',
            duration: '54m',
            thumbnailUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=640&q=80',
            synopsis:
              'Following a devastating gunshot betrayal at the wedding ceremony, Devin must choose between her psychological oath and her devotion to Aslan.',
            videoUrl: 'https://vjs.zencdn.net/v/oceans.mp4',
            releaseDate: 'Oct 3, 2023'
          }
        ]
      }
    ],
    whereToWatch: [
      {
        provider: 'youtube',
        name: 'Watch on YouTube',
        url: 'https://www.youtube.com/results?search_query=aile+dizisi+show+tv',
        iconType: 'youtube',
        freeOrSub: 'Official Channel'
      },
      {
        provider: 'netflix',
        name: 'Watch on Netflix',
        url: 'https://www.netflix.com',
        iconType: 'netflix',
        freeOrSub: 'Subscription'
      }
    ],
    blog: {
      heading: 'Psychological Noir Meets Istanbul Romance: The Brilliance of Aile',
      publishedDate: 'January 2026',
      author: 'CineFlix Drama Critic',
      readTime: '4 min read',
      heroImage: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=1200&q=80',
      sections: [
        {
          title: 'The Sopranos Reimagined on the Bosphorus',
          content:
            'Written by Hakan Bonomo and directed by Ahmet Katıksız, Aile deconstructs the classic mafia crime trope through clinical psychoanalysis. Aslan Soykan is not merely a suited underworld heir; he is a man trapped inside generations of ancestral guilt, emotional neglect, and an omnipotent mother who demands total submission.',
          quote: '“The real family is the one you survive, not the one you are born into.”'
        },
        {
          title: 'Electrifying Screen Chemistry',
          content:
            'Kıvanç Tatlıtuğ and Serenay Sarıkaya generate rare, palpable screen chemistry. Their verbal duels in Devin’s therapy clinic crackle with tension as professional boundaries melt under raw attraction. The series redefines Turkish primetime drama with cinematic color grading, moody jazz cues, and razor-sharp pacing.'
        }
      ],
      trivia: [
        'Kıvanç Tatlıtuğ collaborated with clinical therapists to realistically portray panic attacks on camera.',
        'The lavish seaside mansion used as the Soykan Estate is a historical villa in Reşadiye, Istanbul.'
      ]
    }
  },
  {
    id: 'kelebegin-ruyasi',
    title: "The Butterfly's Dream",
    turkishTitle: 'Kelebeğin Rüyası',
    type: 'movie',
    backdropUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1920&q=80',
    posterLandscapeUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1280&q=80',
    logoText: 'KELEBEĞİN',
    logoSubtext: 'RÜYASI',
    synopsis:
      'Set in 1941 against the coal-dust backdrop of wartime Zonguldak, two young, impoverished poets — Rüştü Onur and Muzaffer Tayyip Uslu — struggle with tuberculosis while passionately writing verses for a beautiful bourgeois high school girl. Directed by Yılmaz Erdoğan, this Oscar-submitted masterpiece is an ode to love, literature, and the fleeting beauty of youth.',
    shortDescription:
      'In a 1940s mining town, two terminally ill poets find solace in verse and enter a lyrical bet for the heart of a charming girl.',
    ambientColor: '#7c3aed', // poetic violet / twilight amber
    ambientGlowRgb: '124, 58, 237',
    trailerUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
    releaseYear: '2013',
    maturityRating: '13+',
    maturityDetails: 'illness, tragedy, emotional heartbreak, smoking, mild language',
    matchScore: 95,
    imdbRating: 8.9,
    durationOrSeasons: '2h 18m',
    genres: ['Romantic Series', 'Poetic Drama', 'Historical', 'Award Winner'],
    thisSeriesIs: ['Poetic', 'Emotional', 'Bittersweet', 'Masterpiece'],
    qualityBadges: ['4K Ultra HD', 'Award Winner'],
    points: 3820,
    trailersAndMore: [
      {
        id: 'butterfly-trailer-main',
        title: "Oscar Submission 4K Trailer: Kelebeğin Rüyası",
        thumbnailUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=640&q=80',
        videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
        duration: '2m 20s'
      },
      {
        id: 'butterfly-featurette',
        title: 'The Poetry of Zonguldak: Behind-the-Scenes',
        thumbnailUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=640&q=80',
        videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
        duration: '4m 12s'
      }
    ],
    cast: [
      {
        id: 'kivanc-tatlitug',
        name: 'Kıvanç Tatlıtuğ',
        character: 'Muzaffer Tayyip Uslu',
        profileUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
        tmdbId: 1087140,
        birthYear: '1983, Adana',
        biography:
          'Kıvanç Tatlıtuğ underwent a dramatic 15kg weight loss for this career-defining role as the tragic young poet Muzaffer Tayyip Uslu, winning immense critical acclaim.'
      },
      {
        id: 'mert-firat',
        name: 'Mert Fırat',
        character: 'Rüştü Onur',
        profileUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80',
        tmdbId: 104252,
        birthYear: '1981, Ankara',
        biography:
          'Celebrated Turkish film actor co-starring as Rüştü Onur, whose radiant optimism and poetic soul illuminate the darkest corners of the sanitarium.'
      },
      {
        id: 'belcim-bilgin',
        name: 'Belçim Bilgin',
        character: 'Suzan Özsoy',
        profileUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
        tmdbId: 104253,
        birthYear: '1983, Ankara',
        biography:
          'Plays Suzan, the mayor’s radiant daughter whose love sparks the immortal poetry contest between the two young writers.'
      },
      {
        id: 'farah-zeynep-abdullah',
        name: 'Farah Zeynep Abdullah',
        character: 'Mediha Sessiz',
        profileUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
        tmdbId: 1124890,
        birthYear: '1989, Istanbul',
        biography:
          'Acclaimed actress playing Mediha Sessiz, Rüştü’s courageous soulmate who shares his journey through the sanitarium.'
      }
    ],
    whereToWatch: [
      {
        provider: 'netflix',
        name: 'Watch on Netflix',
        url: 'https://www.netflix.com',
        iconType: 'netflix',
        freeOrSub: 'Subscription'
      },
      {
        provider: 'youtube',
        name: 'Watch on YouTube Movies',
        url: 'https://www.youtube.com/results?search_query=kelebegin+ruyasi+film',
        iconType: 'youtube',
        freeOrSub: 'Official Channel'
      }
    ],
    blog: {
      heading: 'A Cinematic Masterpiece of Verse: The Poetic Heart of Kelebeğin Rüyası',
      publishedDate: 'November 2026',
      author: 'CineFlix Cinema Guild',
      readTime: '5 min read',
      heroImage: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1200&q=80',
      sections: [
        {
          title: 'Resurrecting Turkey’s Lost Generation of Poets',
          content:
            'Before director Yılmaz Erdoğan embarked on The Butterfly’s Dream, the true stories of Muzaffer Tayyip Uslu and Rüştü Onur were largely forgotten footnotes in mid-century literature. Through sweeping tracking shots of 1940s coal mines, period streetcars, and steam trains, the film pays sublime tribute to young souls whose lives were brief as butterflies yet immortalized in ink.',
          quote: '“Love is like a poem; some write it with ink, some with blood, and some with tears.”'
        },
        {
          title: 'Kıvanç Tatlıtuğ’s Physical Transformation',
          content:
            'To authentically represent a young poet succumbing to consumption, Kıvanç Tatlıtuğ lost over 30 pounds and spent months studying breathing techniques and 1940s Turkish phonetics. His performance alongside Mert Fırat earned standing ovations across international film festivals and was officially submitted to the 86th Academy Awards for Best Foreign Language Film.'
        }
      ],
      trivia: [
        'The film was selected as Turkey’s official entry for the 86th Academy Awards (Oscars).',
        'Composer Rahman Altın won the World Soundtrack Award for the evocative piano score.'
      ]
    }
  },
  {
    id: 'mucize-yedinci-kogus',
    title: 'Miracle in Cell No. 7',
    turkishTitle: '7. Koğuştaki Mucize',
    type: 'movie',
    backdropUrl: 'https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?auto=format&fit=crop&w=1920&q=80',
    posterLandscapeUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=1280&q=80',
    logoText: '7. KOĞUŞTAKİ',
    logoSubtext: 'MUCİZE',
    synopsis:
      'Separated from his beloved daughter Ova, Memo—a loving, intellectually disabled shepherd—is unjustly framed for the tragic death of a military commander’s daughter in 1983 Aegean Turkey. Sentenced to death, Memo touches the hardened hearts of his cynical fellow inmates in Cell 7, who unite in an extraordinary scheme to reunite father and daughter before the gallows.',
    shortDescription:
      'A wrongfully convicted father with an intellectual disability relies on his fellow inmates to see his darling daughter again before his execution.',
    ambientColor: '#d97706',
    ambientGlowRgb: '217, 119, 6',
    trailerUrl: 'https://vjs.zencdn.net/v/oceans.mp4',
    releaseYear: '2019',
    maturityRating: '13+',
    maturityDetails: 'emotional distress, wrongful imprisonment, thematic drama, mild violence',
    matchScore: 99,
    imdbRating: 8.2,
    durationOrSeasons: '2h 12m',
    genres: ['Emotional Drama', 'Family Tragedy', 'Tearjerker', 'Inspiring'],
    thisSeriesIs: ['Emotional', 'Heartbreaking', 'Inspiring', 'Uplifting'],
    qualityBadges: ['4K Ultra HD', 'HDR', 'Dolby Atmos'],
    points: 4620,
    announcementPill: 'Global Sensation • #1 Box Office Hit',
    is_recommended: true,
    trailersAndMore: [
      {
        id: 'mucize-trailer-1',
        title: 'Official International 4K Trailer: Miracle in Cell No. 7',
        thumbnailUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=640&q=80',
        videoUrl: 'https://vjs.zencdn.net/v/oceans.mp4',
        duration: '2m 24s'
      }
    ],
    cast: [
      {
        id: 'cast-aras-bulut',
        name: 'Aras Bulut İynemli',
        character: 'Memo',
        profileUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=240&q=80',
        biography: 'Acclaimed Turkish actor celebrated for portraying complex, deeply emotional roles.'
      },
      {
        id: 'cast-nisa-sofia',
        name: 'Nisa Sofiya Aksongur',
        character: 'Ova',
        profileUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=240&q=80',
        biography: 'Prodigious young talent who captured hearts worldwide as Memo’s daughter.'
      }
    ],
    whereToWatch: [
      {
        provider: 'netflix',
        name: 'Watch on Netflix',
        url: 'https://www.netflix.com',
        iconType: 'netflix',
        freeOrSub: 'Subscription'
      }
    ],
    blog: {
      heading: 'The Global Phenomenon of 7. Koğuştaki Mucize: Love Across Bars',
      publishedDate: 'December 2026',
      author: 'CineFlix Film Review',
      readTime: '4 min read',
      heroImage: 'https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?auto=format&fit=crop&w=1200&q=80',
      sections: [
        {
          title: 'The Emotional Heart of the Story',
          content:
            'Few films in modern cinema history have prompted such universal catharsis as Mehmet Ada Öztekin’s masterpiece. Aras Bulut İynemli’s performance as Memo remains a crowning achievement in Mediterranean filmmaking.'
        }
      ],
      trivia: [
        'The film became the highest-grossing Turkish film of 2019, drawing over 5.3 million admissions in theaters.',
        'It was selected as Turkey’s official submission for Best International Feature Film at the 93rd Academy Awards.'
      ]
    }
  }
];

export const INITIAL_FEEDS: FeedConfig[] = (
  fullBackupData && Array.isArray((fullBackupData as any).feeds) && (fullBackupData as any).feeds.length > 0
    ? ((fullBackupData as any).feeds as FeedConfig[])
    : [
        {
          id: 'feed-dirilis-rec',
          title: 'Because you watched Diriliş: Ertuğrul',
          subtitle: 'Epic historical sagas, warrior brotherhoods & legendary empires',
          categoryKey: 'as_you_watch_dirilis',
          isCuratedByAdmin: true,
          enabled: true
        },
        {
          id: 'feed-special-showcase',
          title: 'Ottoman Dynasties & Conquests',
          subtitle: 'The greatest sultans, conquest commanders, and historical sagas ever produced',
          categoryKey: 'custom',
          enabled: true,
          isCuratedByAdmin: true,
          isSpecialFeed: true,
          specialLogoUrl: '',
          specialExploreText: 'Explore All',
          specialExploreAction: 'category',
          specialExploreCategory: 'historical-ottoman',
          specialTagline: 'HISTORICAL & OTTOMAN SAGAS',
          specialBgImageUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=1920&q=80',
          specialBgDarkness: 0,
          sourceType1: 'categories',
          selectedCategories1: ['Historical & Period Epics', 'Action & Warfare']
        },
        {
          id: 'feed-top10-series',
          title: 'Top 10 Series Today',
          subtitle: 'The most watched dramas ranked by viewers right now',
          categoryKey: 'top_10_series',
          filterType: 'series',
          showRankNumbers: true,
          isCuratedByAdmin: true,
          enabled: true
        },
        {
          id: 'feed-top10-movies',
          title: 'Top 10 Movies Today',
          subtitle: 'Critically acclaimed cinematic epics and feature films',
          categoryKey: 'top_10_movies',
          filterType: 'movie',
          showRankNumbers: true,
          enabled: true
        },
        {
          id: 'feed-you-must-like',
          title: 'You Must Like This',
          subtitle: 'Hand-picked flagship recommendations tuned to your taste',
          categoryKey: 'you_must_like_this',
          enabled: true
        },
        {
          id: 'feed-best-engin',
          title: 'Best of Engin Altan Düzyatan',
          subtitle: 'Starring the award-winning actor from Ertuğrul & Barbaroslar',
          categoryKey: 'best_of_engin_altan',
          filterActor: 'Engin Altan Düzyatan',
          enabled: true
        },
        {
          id: 'feed-best-kivanc',
          title: 'Best of Kıvanç Tatlıtuğ',
          subtitle: 'Iconic performances from heart-throb thrillers to Oscar cinema',
          categoryKey: 'best_of_kivanc',
          filterActor: 'Kıvanç Tatlıtuğ',
          enabled: true
        },
        {
          id: 'feed-romantic-series',
          title: 'Romantic Series for You',
          subtitle: 'Magnetic passion, emotional poetry & forbidden love',
          categoryKey: 'romantic_series',
          filterGenre: 'Romantic Series',
          enabled: true
        },
        {
          id: 'feed-bingey-thrillers',
          title: 'Bingey Thriller Shows to Watch',
          subtitle: 'Heart-pounding suspense, twists, and adrenaline rush',
          categoryKey: 'bingey_thrillers',
          filterGenre: 'Bingey Thriller',
          enabled: true
        }
      ]
);

export const INITIAL_ADMIN_SETTINGS: AdminSettings = (
  fullBackupData && (fullBackupData as any).adminSettings
    ? ((fullBackupData as any).adminSettings as AdminSettings)
    : {
        enableWhereToWatch: true,
        enableHorizontalEpisodes: true,
        autoplayHoverTrailers: true,
        ambientGlowIntensity: 'high',
        dailymotionScriptUrl: 'https://geo.dailymotion.com/libs/player/x1o1xe.js',
        mobileNavbarStyle: 'floating',
        mobileNavbarShowLabels: true,
        mobileRecommendationStyle: 'portrait'
      }
);

export const INITIAL_NOTIFICATIONS = [
  {
    id: 'notif-1',
    showId: 'kurulus-osman',
    title: 'New Episode Available',
    description: 'Kuruluş Osman Season 5 Episode 28 is now streaming in 4K',
    thumbnailUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=240&q=80',
    timeAgo: 'Just now',
    unread: true
  },
  {
    id: 'notif-2',
    showId: 'teskilat',
    title: 'Trending This Week',
    description: 'Teşkilat is ranked #1 across all drama series today',
    thumbnailUrl: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=240&q=80',
    timeAgo: '1d ago',
    unread: true
  },
  {
    id: 'notif-3',
    showId: 'barbaroslar',
    title: 'Recommended For You',
    description: "Explore Barbaroslar: Akdeniz'in Kılıcı starring Engin Altan",
    thumbnailUrl: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=240&q=80',
    timeAgo: '2d ago',
    unread: false
  }
];
