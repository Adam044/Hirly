/**
 * RSS Helper Utilities
 */

const generateJobsRss = (jobs, siteUrl) => {
    let rss = '<?xml version="1.0" encoding="UTF-8" ?>\n';
    rss += '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">\n';
    rss += '<channel>\n';
    rss += '  <title>Hirly - Latest Jobs in Palestine</title>\n';
    rss += `  <link>${siteUrl}/jobs</link>\n`;
    rss += '  <description>Stay updated with the latest professional opportunities and strategic roles in Palestine.</description>\n';
    rss += '  <language>en-us</language>\n';
    rss += `  <atom:link href="${siteUrl}/jobs/rss" rel="self" type="application/rss+xml" />\n`;

    jobs.forEach(job => {
        const title = `${job.title} at ${job.company_name}`;
        const link = `${siteUrl}/jobs/${job.id}/${job.slug}`;
        const description = job.description ? job.description.replace(/<[^>]*>?/gm, '').substring(0, 300) + '...' : '';
        
        rss += '  <item>\n';
        rss += `    <title><![CDATA[${title}]]></title>\n`;
        rss += `    <link>${link}</link>\n`;
        rss += `    <guid isPermaLink="false">hirly-job-${job.id}</guid>\n`;
        rss += `    <pubDate>${new Date(job.created_at).toUTCString()}</pubDate>\n`;
        rss += `    <description><![CDATA[${description}]]></description>\n`;
        if (job.company_logo) {
            rss += `    <enclosure url="${job.company_logo}" length="0" type="image/jpeg" />\n`;
        }
        rss += '  </item>\n';
    });

    rss += '</channel>\n';
    rss += '</rss>';
    return rss;
};

module.exports = {
    generateJobsRss
};
