import mongoose from 'mongoose';

/**
 * Admin-managed navbar items. The Navbar component fetches these and
 * renders one tab per active entry. `path` must start with "/" — it can
 * point at any frontend route, with optional query string for filter
 * shortcuts (e.g. /plays?genre=Box+Cricket).
 */
const navLinkSchema = new mongoose.Schema(
  {
    label: { type: String, required: true, trim: true },
    path: { type: String, required: true, trim: true },
    /* When `end` is true the navbar only highlights this link when the URL
       matches exactly (used for "For You" -> "/"). */
    end: { type: Boolean, default: false },
    /* For "custom" paths (e.g. /c/sports) the page renders a ListingPage of
       this vertical pre-filtered by `filters`. Null for built-in routes. */
    targetVertical: {
      type: String,
      enum: ['dining', 'plays', 'events', null],
      default: null,
    },
    /* Free-form filter map applied to the listing query, e.g.
       { genre: ['Box Cricket'], cuisine: ['Italian'] }. */
    filters: { type: mongoose.Schema.Types.Mixed, default: {} },
    /* Hero banner shown on the matching listing page. Admin-uploaded URL;
       empty falls back to the bundled defaults. */
    heroImage: { type: String, default: '' },
    /* Subtitle shown under the page title. Empty falls back to defaults. */
    heroSubtitle: { type: String, default: '' },
    displayOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

navLinkSchema.index({ label: 1 }, { unique: true });

export default mongoose.model('NavLink', navLinkSchema);
