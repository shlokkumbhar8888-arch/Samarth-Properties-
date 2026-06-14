// ============================================================
// SAMARTH PROPERTIES — URL Slug Generator
// File: backend/src/utils/slug.js
// ============================================================

const slugify = require('slugify');
const { supabase } = require('../config/supabase');

/**
 * Generate a clean URL slug from a title string.
 */
function generateSlug(title) {
    return slugify(title, {
        lower: true,
        strict: true,
        trim: true,
        replacement: '-',
    });
}

/**
 * Generate a unique slug for a given table.
 * Appends -2, -3, etc. if the base slug already exists.
 * Pass excludeId to allow the current record's own slug through.
 */
async function uniqueSlug(title, table, excludeId = null) {
    const base = generateSlug(title);
    let candidate = base;
    let counter = 2;

    while (true) {
        let query = supabase
            .from(table)
            .select('id')
            .eq('slug', candidate);

        if (excludeId) {
            query = query.neq('id', excludeId);
        }

        const { data, error } = await query.maybeSingle();

        if (error) throw new Error(`Slug check failed: ${error.message}`);
        if (!data) return candidate; // slug is available

        candidate = `${base}-${counter}`;
        counter++;
    }
}

module.exports = { generateSlug, uniqueSlug };
