/**
 * SEO Helper Utilities
 */

const slugify = (text) => {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/[^\w\u0600-\u06FF-]+/g, '-') // Replace non-alphanumeric/non-Arabic with hyphens
        .replace(/--+/g, '-')                  // Collapse hyphens
        .replace(/^-+/, '')                    // Trim start
        .replace(/-+$/, '');                   // Trim end
};

const generateJobSlug = (job) => {
    const title = slugify(job.title || 'job');
    const company = slugify(job.company_name || job.display_employer_name || 'hirly');
    return `${title}-at-${company}`;
};

module.exports = {
    slugify,
    generateJobSlug
};
