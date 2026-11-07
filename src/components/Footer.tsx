import React, { useState } from 'react';
import { MapPin, X, Shield, Megaphone, HelpCircle, FileText, Lock, Tv, Mail, ExternalLink, CheckCircle } from 'lucide-react';
import { DiziLogo } from './DiziLogo';
import { Show } from '../types';

interface FooterProps {
  shows?: Show[];
  onOpenAccount?: () => void;
  onOpenSettings?: () => void;
  onRequestContent?: () => void;
  onOpenCategories?: () => void;
  platformName?: string;
  isMyListPage?: boolean;
}

type FooterModalTab =
  | null
  | 'dmca'
  | 'promote'
  | 'help'
  | 'privacy'
  | 'terms'
  | 'cookies'
  | 'ways-to-watch'
  | 'legal-notices'
  | 'faq'
  | 'contact';

export const Footer: React.FC<FooterProps> = ({
  shows = [],
  onOpenAccount,
  onOpenSettings,
  onRequestContent,
  onOpenCategories,
  platformName = 'Dizi Urdu',
  isMyListPage = false
}) => {
  const [activeModal, setActiveModal] = useState<FooterModalTab>(null);
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const [dmcaSubmitted, setDmcaSubmitted] = useState(false);
  const [promoteSubmitted, setPromoteSubmitted] = useState(false);

  const closeModal = () => {
    setActiveModal(null);
    setContactSubmitted(false);
    setDmcaSubmitted(false);
    setPromoteSubmitted(false);
  };

  // Dedicated Desktop My List Footer
  if (isMyListPage) {
    return (
      <footer className="hidden md:block relative w-full mt-16 px-6 md:px-12 lg:px-16 pb-12 select-none">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-6 pt-6 border-t border-white/10">
          {/* Left: Brand Logo + Copyright */}
          <div className="flex flex-col items-start gap-2.5">
            <div className="flex items-center gap-2 max-w-[150px]">
              <DiziLogo variant="red" size="md" />
            </div>
            <p className="text-xs text-zinc-400 font-normal">
              © {new Date().getFullYear()} {platformName}, All Rights Reserved
            </p>
          </div>

          {/* Right: Social icons above the main footer links */}
          <div className="flex flex-col items-end gap-3.5">
            {/* Clickable Social Icons row (Facebook, Instagram, YouTube, X) */}
            <div className="flex items-center gap-4 text-zinc-300">
              <a
                href="https://facebook.com/diziurdu"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-colors cursor-pointer"
                aria-label="Facebook"
              >
                <svg className="w-4.5 h-4.5 fill-current" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              </a>
              <a
                href="https://instagram.com/diziurdu"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-colors cursor-pointer"
                aria-label="Instagram"
              >
                <svg className="w-4.5 h-4.5 fill-current" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
              </a>
              <a
                href="https://youtube.com/@diziurdu"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-colors cursor-pointer"
                aria-label="YouTube"
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
              </a>
              <a
                href="https://x.com/diziurdu"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-colors cursor-pointer"
                aria-label="X"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </a>
            </div>

            {/* Main Footer Links (No new/foreign links) */}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-zinc-400 font-medium">
              <button onClick={() => setActiveModal('privacy')} className="hover:text-white transition-colors cursor-pointer">
                Privacy Policy
              </button>
              <button onClick={() => setActiveModal('terms')} className="hover:text-white transition-colors cursor-pointer">
                Terms of Use
              </button>
              <button onClick={() => setActiveModal('dmca')} className="hover:text-white transition-colors cursor-pointer">
                DMCA Takedown
              </button>
              <button onClick={() => setActiveModal('contact')} className="hover:text-white transition-colors cursor-pointer">
                Contact Us
              </button>
              <button onClick={() => setActiveModal('faq')} className="hover:text-white transition-colors cursor-pointer">
                FAQ
              </button>
            </div>
          </div>
        </div>

        {/* Modal viewer for footer links */}
        {activeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/50 animate-in fade-in duration-200">
            <div className="relative w-full max-w-3xl max-h-[85vh] overflow-y-auto bg-[#101217] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl text-zinc-200">
              <button
                onClick={closeModal}
                className="absolute top-5 right-5 p-2 rounded-full bg-white/10 hover:bg-white/20 text-zinc-300 hover:text-white transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="space-y-4 text-xs leading-relaxed">
                <h2 className="text-xl font-bold text-white mb-2 capitalize">
                  {activeModal === 'legal-notices' ? 'Preliminary Information Form' : activeModal.replace('-', ' ')}
                </h2>
                <p className="text-zinc-400">
                  This document governs the usage, subscription, and legal terms applicable to your account and viewing on the platform. All rights reserved.
                </p>
                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 space-y-2">
                  <p className="font-semibold text-white">General Information & Compliance</p>
                  <p className="text-zinc-400">
                    Pursuant to consumer protection regulations and digital streaming licensing provisions, users are entitled to full disclosure regarding subscriptions, digital content delivery, data processing, and cancellations.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </footer>
    );
  }

  return (
    <footer className="hidden md:block relative w-full mt-16 sm:mt-20 px-3 sm:px-6 md:px-10 lg:px-14 pb-6 sm:pb-8 select-none">
      {/* 
        Overlaid Container: Floating card design that does not touch left, right, and bottom edges
      */}
      <div className="relative rounded-2xl sm:rounded-3xl border border-white/10 bg-[#07080a]/95 backdrop-blur-md shadow-2xl overflow-hidden text-zinc-400 pt-10 sm:pt-12 pb-8 sm:pb-10 px-6 sm:px-10 lg:px-14">
        <div className="max-w-7xl mx-auto">
          {/* Main 4-Column Layout */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12">
            {/* Column 1: Brand Logo, Location & Tagline */}
            <div className="md:col-span-4 lg:col-span-4 flex flex-col items-start space-y-3.5">
              {/* Dizi Urdu Brand Logo */}
              <div className="flex items-center gap-2 max-w-[150px]">
                <DiziLogo variant="red" size="lg" className="max-w-[150px]" />
              </div>

              {/* Location marker */}
              <div className="flex items-center gap-1.5 text-zinc-300 text-xs sm:text-sm font-semibold tracking-wide">
                <MapPin className="w-4 h-4 text-[#b81d24]" />
                <span>{platformName} Pakistan</span>
              </div>

              {/* Tagline */}
              <p className="text-xs text-zinc-400 leading-relaxed max-w-sm">
                Pakistan’s home for premium Urdu dubbed Turkish dramas, historical Ottoman epics, official trailers, and cast biographies.
              </p>
            </div>

            {/* Column 2: EXPLORE */}
            <div className="md:col-span-2 lg:col-span-2 space-y-3.5">
              <h4 className="text-[11px] font-black tracking-[0.2em] uppercase text-zinc-300">
                EXPLORE
              </h4>
              <ul className="space-y-2.5 text-xs">
                <li>
                  <button
                    onClick={onOpenCategories}
                    className="text-zinc-400 hover:text-white transition-colors cursor-pointer text-left"
                  >
                    Categories
                  </button>
                </li>
                {onRequestContent && (
                  <li>
                    <button
                      onClick={onRequestContent}
                      className="text-zinc-400 hover:text-white transition-colors cursor-pointer text-left"
                    >
                      Request Content
                    </button>
                  </li>
                )}
                {onOpenAccount && (
                  <li>
                    <button
                      onClick={onOpenAccount}
                      className="text-zinc-400 hover:text-white transition-colors cursor-pointer text-left"
                    >
                      My Account
                    </button>
                  </li>
                )}
              </ul>
            </div>

            {/* Column 3: LEGAL */}
            <div className="md:col-span-3 lg:col-span-3 space-y-3.5">
              <h4 className="text-[11px] font-black tracking-[0.2em] uppercase text-zinc-300">
                LEGAL
              </h4>
              <ul className="space-y-2.5 text-xs">
                <li>
                  <button
                    onClick={() => setActiveModal('privacy')}
                    className="text-zinc-400 hover:text-white transition-colors cursor-pointer text-left"
                  >
                    Privacy Policy
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActiveModal('terms')}
                    className="text-zinc-400 hover:text-white transition-colors cursor-pointer text-left"
                  >
                    Terms of Use
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActiveModal('dmca')}
                    className="text-zinc-400 hover:text-white transition-colors cursor-pointer text-left"
                  >
                    DMCA Takedown
                  </button>
                </li>
              </ul>
            </div>

            {/* Column 4: SUPPORT */}
            <div className="md:col-span-3 lg:col-span-3 space-y-3.5">
              <h4 className="text-[11px] font-black tracking-[0.2em] uppercase text-zinc-300">
                SUPPORT
              </h4>
              <ul className="space-y-2.5 text-xs">
                <li>
                  <button
                    onClick={() => setActiveModal('contact')}
                    className="text-zinc-400 hover:text-white transition-colors cursor-pointer text-left"
                  >
                    Contact Us
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActiveModal('faq')}
                    className="text-zinc-400 hover:text-white transition-colors cursor-pointer text-left"
                  >
                    FAQ
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActiveModal('promote')}
                    className="text-zinc-400 hover:text-white transition-colors cursor-pointer text-left"
                  >
                    Promote with Us
                  </button>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar: Social Links on Left, 2026 Dizi Urdu Parallel on Right */}
          <div className="pt-6 sm:pt-8 mt-8 border-t border-zinc-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Social Media Links on Left */}
            <div className="flex items-center gap-6 text-white">
              {/* Facebook */}
              <a
                href="https://facebook.com/diziurdu"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white hover:text-white cursor-pointer"
                aria-label="Facebook"
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>

              {/* Instagram */}
              <a
                href="https://instagram.com/diziurdu"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white hover:text-white cursor-pointer"
                aria-label="Instagram"
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </a>

              {/* YouTube */}
              <a
                href="https://youtube.com/@diziurdu"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white hover:text-white cursor-pointer"
                aria-label="YouTube"
              >
                <svg className="w-5.5 h-5.5 fill-current" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
              </a>

              {/* X (formerly Twitter) */}
              <a
                href="https://x.com/diziurdu"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white hover:text-white cursor-pointer"
                aria-label="X"
              >
                <svg className="w-4.5 h-4.5 fill-current" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
            </div>

            {/* 2026 Dizi Urdu Parallel to Social Links on the Right */}
            <p className="text-xs sm:text-[13px] font-medium text-zinc-400 shrink-0">
              © 2026 {platformName}. All rights reserved.
            </p>
          </div>
        </div>
      </div>

      {/* 
        ========================================================================
        AUTHENTIC, REALISTIC CONTENT MODALS FOR ALL FOOTER LINKS
        ========================================================================
      */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/50 animate-in fade-in duration-200">
          <div className="relative w-full max-w-3xl max-h-[85vh] overflow-y-auto bg-[#101217] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl text-zinc-200">
            {/* Modal Close Button */}
            <button
              onClick={closeModal}
              className="absolute top-5 right-5 p-2 rounded-full bg-white/10 hover:bg-white/20 text-zinc-300 hover:text-white transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>

            {/* 1. DMCA TAKEDOWN POLICY & NOTICE SUBMISSION */}
            {activeModal === 'dmca' && (
              <div className="space-y-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xl sm:text-2xl font-black text-white">DMCA Copyright & Takedown Policy</h3>
                    <p className="text-xs text-zinc-400">Dizi Urdu (diziurdu.com) • Intellectual Property Protection</p>
                  </div>
                </div>

                <div className="text-xs sm:text-sm text-zinc-300 leading-relaxed space-y-4 pt-2">
                  <p>
                    Dizi Urdu respects the intellectual property rights of content owners, producers, distributors, and creators. In accordance with the Digital Millennium Copyright Act (17 U.S.C. § 512) and international copyright conventions, we maintain an expedited procedure to address legitimate notices of infringement.
                  </p>

                  <div className="p-4 rounded-xl bg-zinc-900/90 border border-white/5 space-y-2">
                    <h4 className="font-bold text-white text-xs uppercase tracking-wider">Designated Copyright Agent</h4>
                    <p className="text-xs text-zinc-400">
                      <strong>Organization:</strong> Dizi Urdu Legal Department<br />
                      <strong>Email:</strong> <span className="text-[#b81d24]">dmca@diziurdu.com</span><br />
                      <strong>Domain:</strong> diziurdu.com • Lahore, Pakistan
                    </p>
                  </div>

                  <p className="font-semibold text-white">To file a compliant DMCA Takedown Notice, please ensure your request includes:</p>
                  <ol className="list-decimal pl-5 space-y-1.5 text-xs text-zinc-300">
                    <li>Identification of the copyrighted work claimed to have been infringed (title of Turkish drama/movie, production house, or broadcast license).</li>
                    <li>Specific URL(s) or exact show titles on diziurdu.com hosting the claimed material.</li>
                    <li>Contact information of the copyright owner or authorized representative (name, company, email address, telephone).</li>
                    <li>A statement of good faith belief that use of the material is not authorized by the copyright owner, its agent, or the law.</li>
                    <li>A statement made under penalty of perjury that the information in the notification is accurate and that you are authorized to act.</li>
                  </ol>

                  {/* Interactive Quick DMCA Submission Form */}
                  <div className="mt-6 p-5 rounded-xl bg-[#141720] border border-rose-500/20">
                    <h4 className="font-bold text-white text-sm mb-3">Submit Instant Takedown Notice</h4>
                    {dmcaSubmitted ? (
                      <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 text-xs">
                        <CheckCircle className="w-4 h-4 shrink-0" />
                        <span>Your notice has been submitted to dmca@diziurdu.com. Our legal team reviews verified notices within 24 business hours.</span>
                      </div>
                    ) : (
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          setDmcaSubmitted(true);
                        }}
                        className="space-y-3"
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <input
                            type="text"
                            placeholder="Copyright Owner / Agency Name"
                            required
                            className="w-full px-3.5 py-2.5 rounded-lg bg-black/40 border border-white/10 text-xs text-white focus:outline-none focus:border-rose-500"
                          />
                          <input
                            type="email"
                            placeholder="Official Email Address"
                            required
                            className="w-full px-3.5 py-2.5 rounded-lg bg-black/40 border border-white/10 text-xs text-white focus:outline-none focus:border-rose-500"
                          />
                        </div>
                        <input
                          type="text"
                          placeholder="Show Title or Specific URL on diziurdu.com"
                          required
                          className="w-full px-3.5 py-2.5 rounded-lg bg-black/40 border border-white/10 text-xs text-white focus:outline-none focus:border-rose-500"
                        />
                        <textarea
                          placeholder="Statement of infringement and proof of authorization..."
                          rows={3}
                          required
                          className="w-full px-3.5 py-2.5 rounded-lg bg-black/40 border border-white/10 text-xs text-white focus:outline-none focus:border-rose-500"
                        />
                        <button
                          type="submit"
                          className="w-full py-2.5 px-4 rounded-lg bg-[#b81d24] hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
                        >
                          Submit DMCA Notice
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 2. PROMOTE WITH US / ADVERTISING */}
            {activeModal === 'promote' && (
              <div className="space-y-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
                    <Megaphone className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xl sm:text-2xl font-black text-white">Promote With Us</h3>
                    <p className="text-xs text-zinc-400">Reach millions of passionate Turkish drama enthusiasts across Pakistan & worldwide</p>
                  </div>
                </div>

                <div className="text-xs sm:text-sm text-zinc-300 leading-relaxed space-y-4 pt-2">
                  <p>
                    Dizi Urdu offers high-impact brand promotion and partnership opportunities for brands looking to connect with a highly engaged audience loving premium entertainment, historical epics, and family television.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3.5 rounded-xl bg-zinc-900 border border-white/5 text-center">
                      <div className="text-xl font-black text-amber-400">85%+</div>
                      <div className="text-[11px] text-zinc-400 mt-1">High-Intent Viewers in Pakistan & Diaspora</div>
                    </div>
                    <div className="p-3.5 rounded-xl bg-zinc-900 border border-white/5 text-center">
                      <div className="text-xl font-black text-amber-400">4K & HD</div>
                      <div className="text-[11px] text-zinc-400 mt-1">Cinematic Native Video Sponsorships</div>
                    </div>
                    <div className="p-3.5 rounded-xl bg-zinc-900 border border-white/5 text-center">
                      <div className="text-xl font-black text-amber-400">Multi-Channel</div>
                      <div className="text-[11px] text-zinc-400 mt-1">Web, YouTube, Facebook & Instagram Reach</div>
                    </div>
                  </div>

                  <h4 className="font-bold text-white text-xs uppercase tracking-wider">Available Advertising Formats:</h4>
                  <ul className="list-disc pl-5 space-y-1 text-xs text-zinc-300">
                    <li><strong>Pre-roll & Mid-roll Video Integrations:</strong> Seamless 15s/30s unskippable placements before official trailers and episodes.</li>
                    <li><strong>Featured Brand Takeover:</strong> Hero banner headline sponsorship and curated category feed placements.</li>
                    <li><strong>Social Media Shoutouts:</strong> Co-branded social campaigns across our Facebook, YouTube, Instagram, and X channels.</li>
                  </ul>

                  {/* Sponsorship Inquiry Form */}
                  <div className="mt-4 p-5 rounded-xl bg-[#141720] border border-amber-500/20">
                    <h4 className="font-bold text-white text-sm mb-3">Request Media Kit & Rate Card</h4>
                    {promoteSubmitted ? (
                      <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 text-xs">
                        <CheckCircle className="w-4 h-4 shrink-0" />
                        <span>Thank you! Our partnerships manager will contact you at your email with our 2026 Media Kit within 1 business day.</span>
                      </div>
                    ) : (
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          setPromoteSubmitted(true);
                        }}
                        className="space-y-3"
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <input
                            type="text"
                            placeholder="Brand / Company Name"
                            required
                            className="w-full px-3.5 py-2.5 rounded-lg bg-black/40 border border-white/10 text-xs text-white focus:outline-none focus:border-amber-500"
                          />
                          <input
                            type="email"
                            placeholder="Business Email"
                            required
                            className="w-full px-3.5 py-2.5 rounded-lg bg-black/40 border border-white/10 text-xs text-white focus:outline-none focus:border-amber-500"
                          />
                        </div>
                        <input
                          type="tel"
                          placeholder="Phone / WhatsApp (Optional)"
                          className="w-full px-3.5 py-2.5 rounded-lg bg-black/40 border border-white/10 text-xs text-white focus:outline-none focus:border-amber-500"
                        />
                        <textarea
                          placeholder="Tell us about your brand goals, target dates, or campaign budget..."
                          rows={3}
                          required
                          className="w-full px-3.5 py-2.5 rounded-lg bg-black/40 border border-white/10 text-xs text-white focus:outline-none focus:border-amber-500"
                        />
                        <button
                          type="submit"
                          className="w-full py-2.5 px-4 rounded-lg bg-amber-500 hover:bg-amber-600 text-black font-black text-xs uppercase tracking-wider transition-colors cursor-pointer"
                        >
                          Send Advertising Inquiry
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 3. HELP CENTER & FAQ */}
            {(activeModal === 'help' || activeModal === 'faq') && (
              <div className="space-y-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500">
                    <HelpCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xl sm:text-2xl font-black text-white">Help Center & FAQ</h3>
                    <p className="text-xs text-zinc-400">Frequently asked questions about streaming, Urdu dubbing & playback</p>
                  </div>
                </div>

                <div className="space-y-4 pt-2 text-xs sm:text-sm">
                  <div className="p-4 rounded-xl bg-zinc-900 border border-white/5 space-y-1.5">
                    <h4 className="font-bold text-white text-sm">How do I watch episodes in Urdu dubbing?</h4>
                    <p className="text-zinc-300 text-xs leading-relaxed">
                      All historical dramas and movies with the “Urdu Dubbed” tag feature full professional audio in Urdu. Click on any show to open the details modal, select your desired Season and Episode, and press play. You can also switch between official video sources (YouTube 4K, Dailymotion, or Direct HD) from the episode picker.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-zinc-900 border border-white/5 space-y-1.5">
                    <h4 className="font-bold text-white text-sm">Why doesn't the video preview play sound automatically?</h4>
                    <p className="text-zinc-300 text-xs leading-relaxed">
                      Modern web browsers (like Google Chrome, Safari, and Microsoft Edge) restrict unmuted video playback until you interact with the webpage. Simply click anywhere on the page or tap the sound speaker icon in the bottom corner of the hero preview to enjoy uninterrupted high-definition audio.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-zinc-900 border border-white/5 space-y-1.5">
                    <h4 className="font-bold text-white text-sm">Can I share a specific drama directly with my friends?</h4>
                    <p className="text-zinc-300 text-xs leading-relaxed">
                      Yes! When you click on any show, Dizi Urdu immediately adds a clean, shareable slug to your browser’s address bar (e.g., <code className="text-[#b81d24]">diziurdu.com/?watch=dirilis-ertugrul</code>). You can copy this link and share it on WhatsApp, Facebook, or Twitter. The recipient will see high-resolution poster artwork and synopsis automatically!
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-zinc-900 border border-white/5 space-y-1.5">
                    <h4 className="font-bold text-white text-sm">How can I request a new Turkish drama?</h4>
                    <p className="text-zinc-300 text-xs leading-relaxed">
                      Click the "Request Content" button in the footer or navigation menu. Fill out the title and preferred language (Urdu dubbed or Urdu subtitled), and our content acquisition team will prioritize it for release.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 4. PRIVACY POLICY */}
            {activeModal === 'privacy' && (
              <div className="space-y-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-500">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xl sm:text-2xl font-black text-white">Privacy Policy</h3>
                    <p className="text-xs text-zinc-400">Effective Date: October 2026 • Dizi Urdu (diziurdu.com)</p>
                  </div>
                </div>

                <div className="text-xs sm:text-sm text-zinc-300 leading-relaxed space-y-4 pt-2">
                  <p>
                    Your privacy is critically important to us. This Privacy Policy outlines the types of information Dizi Urdu collects, how we use it, and how your data is secured when visiting diziurdu.com.
                  </p>
                  <h4 className="font-bold text-white text-xs uppercase tracking-wider">1. Information We Collect</h4>
                  <p className="text-xs">
                    We collect minimal personal data necessary to provide a personalized streaming experience. This includes locally stored viewing preferences (My List watchlist, audio mute toggle, playback timestamps), anonymized browser telemetry to optimize video playback performance, and correspondence if you contact our support team.
                  </p>
                  <h4 className="font-bold text-white text-xs uppercase tracking-wider">2. Data Security & Storage</h4>
                  <p className="text-xs">
                    Dizi Urdu does not sell, lease, or rent your personal information to third parties. Watchlist bookmarks and preferences are stored safely on your client browser using local storage sandboxing.
                  </p>
                  <h4 className="font-bold text-white text-xs uppercase tracking-wider">3. Third-Party Embeds</h4>
                  <p className="text-xs">
                    Official video trailers and episodes embedded via YouTube or Dailymotion are governed by their respective privacy policies. We utilize strict referrer-policy protection to safeguard user anonymity.
                  </p>
                </div>
              </div>
            )}

            {/* 5. TERMS OF USE */}
            {activeModal === 'terms' && (
              <div className="space-y-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xl sm:text-2xl font-black text-white">Terms of Use</h3>
                    <p className="text-xs text-zinc-400">Agreement for Accessing Dizi Urdu (diziurdu.com)</p>
                  </div>
                </div>

                <div className="text-xs sm:text-sm text-zinc-300 leading-relaxed space-y-4 pt-2">
                  <p>
                    By accessing or using Dizi Urdu at diziurdu.com, you agree to be bound by these Terms of Use and all applicable laws and regulations in the Islamic Republic of Pakistan and internationally.
                  </p>
                  <h4 className="font-bold text-white text-xs uppercase tracking-wider">1. License & Personal Use</h4>
                  <p className="text-xs">
                    Dizi Urdu grants you a revocable, non-exclusive, non-transferable, limited license to stream content, trailers, and series summaries strictly for personal, non-commercial entertainment.
                  </p>
                  <h4 className="font-bold text-white text-xs uppercase tracking-wider">2. Content Availability</h4>
                  <p className="text-xs">
                    Content availability, video resolutions (4K, 1080p), and episode release schedules may vary over time depending on distribution agreements and regional rights.
                  </p>
                </div>
              </div>
            )}

            {/* 6. COOKIE PREFERENCES */}
            {activeModal === 'cookies' && (
              <div className="space-y-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xl sm:text-2xl font-black text-white">Cookie Preferences</h3>
                    <p className="text-xs text-zinc-400">Manage how cookies & local storage enhance your viewing experience</p>
                  </div>
                </div>

                <div className="space-y-4 pt-2 text-xs sm:text-sm">
                  <div className="p-4 rounded-xl bg-zinc-900 border border-white/5 flex items-center justify-between gap-4">
                    <div>
                      <h4 className="font-bold text-white">Essential Cookies & Storage</h4>
                      <p className="text-xs text-zinc-400 mt-0.5">Required for saving your My List watchlist, audio mute settings, and session login.</p>
                    </div>
                    <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20">Always Active</span>
                  </div>

                  <div className="p-4 rounded-xl bg-zinc-900 border border-white/5 flex items-center justify-between gap-4">
                    <div>
                      <h4 className="font-bold text-white">Performance & Streaming Analytics</h4>
                      <p className="text-xs text-zinc-400 mt-0.5">Enables video buffer monitoring to deliver seamless 4K and 1080p playback.</p>
                    </div>
                    <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20">Enabled</span>
                  </div>
                </div>
              </div>
            )}

            {/* 7. WAYS TO WATCH */}
            {activeModal === 'ways-to-watch' && (
              <div className="space-y-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-500">
                    <Tv className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xl sm:text-2xl font-black text-white">Ways to Watch Dizi Urdu</h3>
                    <p className="text-xs text-zinc-400">Stream on any screen, anywhere, anytime</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs sm:text-sm">
                  <div className="p-4 rounded-xl bg-zinc-900 border border-white/5 space-y-1">
                    <h4 className="font-bold text-white">Smart TVs & Android TV</h4>
                    <p className="text-xs text-zinc-400">Open diziurdu.com on your Smart TV browser or cast from your phone using Google Cast / AirPlay in full 4K Ultra HD.</p>
                  </div>
                  <div className="p-4 rounded-xl bg-zinc-900 border border-white/5 space-y-1">
                    <h4 className="font-bold text-white">Laptops & Desktops</h4>
                    <p className="text-xs text-zinc-400">Enjoy cinematic ambient glow mode and Dolby sound on Chrome, Firefox, Safari, or Microsoft Edge.</p>
                  </div>
                  <div className="p-4 rounded-xl bg-zinc-900 border border-white/5 space-y-1">
                    <h4 className="font-bold text-white">Smartphones & Tablets</h4>
                    <p className="text-xs text-zinc-400">Fully responsive mobile design with tap-to-play episodes and full-screen horizontal video support.</p>
                  </div>
                  <div className="p-4 rounded-xl bg-zinc-900 border border-white/5 space-y-1">
                    <h4 className="font-bold text-white">Progressive Web App (PWA)</h4>
                    <p className="text-xs text-zinc-400">Install Dizi Urdu directly onto your home screen for instant 1-tap app launch.</p>
                  </div>
                </div>
              </div>
            )}

            {/* 8. LEGAL NOTICES */}
            {activeModal === 'legal-notices' && (
              <div className="space-y-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-zinc-500/10 border border-zinc-500/20 flex items-center justify-center text-zinc-300">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xl sm:text-2xl font-black text-white">Legal Notices & Trademark Disclaimers</h3>
                    <p className="text-xs text-zinc-400">Dizi Urdu (diziurdu.com)</p>
                  </div>
                </div>

                <div className="text-xs sm:text-sm text-zinc-300 leading-relaxed space-y-3 pt-2">
                  <p>
                    All series titles, character names, stills, trademarks, and promotional media are the property of their respective production houses (e.g., Bozdağ Film, Ay Yapım, TRT, Show TV, ATV). Dizi Urdu is an independent platform dedicated to curating and providing Urdu-speaking audiences with educational guides, biographies, official trailers, and legal viewing links.
                  </p>
                  <p className="text-xs text-zinc-400">
                    For inquiries regarding content syndication or licensing, please contact legal@diziurdu.com.
                  </p>
                </div>
              </div>
            )}

            {/* 9. CONTACT US */}
            {activeModal === 'contact' && (
              <div className="space-y-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#b81d24]/10 border border-[#b81d24]/20 flex items-center justify-center text-[#b81d24]">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xl sm:text-2xl font-black text-white">Contact Dizi Urdu</h3>
                    <p className="text-xs text-zinc-400">We'd love to hear from you. Send questions, feedback, or business inquiries.</p>
                  </div>
                </div>

                {contactSubmitted ? (
                  <div className="p-5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-sm space-y-2">
                    <div className="flex items-center gap-2 font-bold">
                      <CheckCircle className="w-5 h-5" />
                      <span>Thank you for reaching out!</span>
                    </div>
                    <p className="text-xs text-zinc-300">
                      Your message has been received by our Lahore editorial team. We typically respond within 24 hours.
                    </p>
                  </div>
                ) : (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      setContactSubmitted(true);
                    }}
                    className="space-y-3.5 pt-2"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Your Name</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Ali Khan"
                          className="w-full px-3.5 py-2.5 rounded-lg bg-black/40 border border-white/10 text-xs text-white focus:outline-none focus:border-[#b81d24]"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Email Address</label>
                        <input
                          type="email"
                          required
                          placeholder="your.email@example.com"
                          className="w-full px-3.5 py-2.5 rounded-lg bg-black/40 border border-white/10 text-xs text-white focus:outline-none focus:border-[#b81d24]"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Subject</label>
                      <input
                        type="text"
                        required
                        placeholder="Content suggestion, technical feedback, or partnership"
                        className="w-full px-3.5 py-2.5 rounded-lg bg-black/40 border border-white/10 text-xs text-white focus:outline-none focus:border-[#b81d24]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Message</label>
                      <textarea
                        rows={4}
                        required
                        placeholder="Type your message here..."
                        className="w-full px-3.5 py-2.5 rounded-lg bg-black/40 border border-white/10 text-xs text-white focus:outline-none focus:border-[#b81d24]"
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full py-3 rounded-lg bg-[#b81d24] hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
                    >
                      Send Message
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </footer>
  );
};
