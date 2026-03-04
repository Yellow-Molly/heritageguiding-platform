'use client'

import { Link } from '@/i18n/navigation'
import { MapPin, Phone, Mail, Clock, Facebook, Instagram, Youtube, Linkedin } from 'lucide-react'

const footerLinks = {
  tours: {
    title: 'Tours',
    links: [
      { name: 'Gamla Stan Walking Tour', href: '/tours/gamla-stan-walking' },
      { name: 'Royal Palace Experience', href: '/tours/royal-palace' },
      { name: 'Vasa Museum Deep Dive', href: '/tours/vasa-museum' },
      { name: 'Private Tours', href: '/tours?type=private' },
      { name: 'Group Tours', href: '/tours?type=group' },
    ],
  },
  support: {
    title: 'Support',
    links: [
      { name: 'FAQ', href: '/faq' },
      { name: 'Contact Us', href: '/contact' },
      { name: 'Booking Help', href: '/help/booking' },
      { name: 'Cancellation Policy', href: '/help/cancellation' },
      { name: 'Accessibility', href: '/accessibility' },
    ],
  },
  company: {
    title: 'Company',
    links: [
      { name: 'About Us', href: '/about-us' },
      { name: 'Our Guides', href: '/guides' },
      { name: 'Blog', href: '/blog' },
      { name: 'Careers', href: '/careers' },
      { name: 'Press', href: '/press' },
    ],
  },
  legal: {
    title: 'Legal',
    links: [
      { name: 'Terms of Service', href: '/terms' },
      { name: 'Privacy Policy', href: '/privacy' },
      { name: 'Cookie Policy', href: '/cookies' },
    ],
  },
}

const socialLinks = [
  { name: 'Facebook', icon: Facebook, href: 'https://facebook.com' },
  { name: 'Instagram', icon: Instagram, href: 'https://instagram.com' },
  { name: 'YouTube', icon: Youtube, href: 'https://youtube.com' },
  { name: 'LinkedIn', icon: Linkedin, href: 'https://linkedin.com' },
]

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-[#0b0b0b] text-white" aria-label="Site footer">
      {/* Newsletter Section */}
      <div className="border-b border-[#3e3e3e]">
        <div className="container mx-auto px-4 py-12 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="text-center md:text-left">
              <h3 className="mb-2 font-serif text-2xl font-bold text-white">Stay Updated</h3>
              <p className="text-[#e6d3a0]/70">
                Subscribe to receive exclusive offers and heritage insights.
              </p>
            </div>
            <form className="flex w-full max-w-md gap-3" onSubmit={(e) => e.preventDefault()}>
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 rounded-lg border border-[#DBC078]/30 bg-white/10 px-4 py-3 text-white placeholder:text-white/50 focus:border-[#DBC078] focus:outline-none"
                aria-label="Email address for newsletter"
              />
              <button
                type="submit"
                className="rounded-lg bg-[#DBC078] px-6 py-3 font-medium text-[#0b0b0b] transition-colors hover:bg-[#d0ad50]"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="container mx-auto px-4 py-16 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-5">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <Link href="/" className="mb-6 inline-block font-serif text-2xl font-bold text-white">
              Private Tours
            </Link>
            <p className="mb-6 max-w-sm text-[#e6d3a0]/70">
              Discover Stockholm&apos;s rich history with expert-led heritage tours. Licensed
              guides, authentic experiences, unforgettable memories.
            </p>

            {/* Contact Info */}
            <div className="space-y-3 text-sm text-[#e6d3a0]/70">
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-[#DBC078]" />
                <span>Gamla Stan, Stockholm, Sweden</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-[#DBC078]" />
                <a href="tel:+46812345678" className="transition-colors hover:text-white">
                  +46 8 123 456 78
                </a>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-[#DBC078]" />
                <a href="mailto:info@privatetours.se" className="transition-colors hover:text-white">
                  info@privatetours.se
                </a>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-[#DBC078]" />
                <span>Daily 9:00 - 18:00 CET</span>
              </div>
            </div>

            {/* Social Links */}
            <div className="mt-6 flex gap-4">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-[#DBC078] hover:text-[#0b0b0b]"
                  aria-label={social.name}
                >
                  <social.icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Links Columns */}
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4 lg:col-span-3 lg:grid-cols-4">
            {Object.values(footerLinks).map((column) => (
              <div key={column.title}>
                <h4 className="mb-4 font-semibold text-[#DBC078]">{column.title}</h4>
                <ul className="space-y-3">
                  {column.links.map((link) => (
                    <li key={link.name}>
                      <Link
                        href={link.href}
                        className="text-sm text-[#e6d3a0]/70 transition-colors hover:text-white"
                      >
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-[#3e3e3e]">
        <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 py-6 text-sm text-[#e6d3a0]/50 md:flex-row lg:px-8">
          <p>&copy; {currentYear} Private Tours. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span>Language:</span>
            <select
              className="rounded border border-[#3e3e3e] bg-transparent px-2 py-1 text-[#e6d3a0]/70 focus:border-[#DBC078] focus:outline-none"
              defaultValue="en"
              aria-label="Select language"
            >
              <option value="en" className="bg-[#0b0b0b]">English</option>
              <option value="sv" className="bg-[#0b0b0b]">Svenska</option>
              <option value="de" className="bg-[#0b0b0b]">Deutsch</option>
            </select>
          </div>
        </div>
      </div>
    </footer>
  )
}
