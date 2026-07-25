# ZXG Wellness Website Improvement Report

## Purpose of this work

The goal was to make the ZXG Wellness website safer, more reliable, easier for customers to use, easier for Google to understand, and faster on mobile devices.

This work covered:

- Stripe payment notifications
- Contact-form delivery
- Newsletter signup
- Google SEO
- Product and article information shown to Google
- Google Search Console preparation
- Social-media visibility
- Contact-page design
- Frequently asked questions
- Image and video optimization
- Mobile performance
- Accessibility
- Website security
- Testing and deployment

The website design and shopping flow were preserved. Changes were tested before being pushed to the GitHub repository and deployed through Vercel.

---

## 1. Stripe payment notification protection

### Problem found

Stripe sends a secure message to the website after a payment succeeds. This is called a webhook.

Stripe signs this message so the website can confirm that it genuinely came from Stripe. The website must read the message exactly as Stripe sent it. Vercel normally processes incoming request data before the website code receives it, which can change how the message is read.

The Stripe webhook file did not explicitly tell Vercel to leave the incoming message untouched. Because of this, real Stripe payment notifications could fail their security check.

### Possible business effect

If the webhook failed:

- Stripe could successfully charge a customer.
- The website might not finish its paid-order processing.
- Order notifications could fail.
- Order records might not be updated through the expected Stripe event.
- The failure could be easy to miss unless Stripe's webhook delivery logs were checked.

### Correction completed

The webhook was configured so Vercel does not process the request body before Stripe verifies it.

The existing Stripe security check was preserved. The website still rejects messages that do not have a valid Stripe signature.

### Stripe setup explained

The Stripe destination should use:

- Destination type: Webhook endpoint
- Events from: Your account
- Event: `payment_intent.succeeded`
- Endpoint: `https://www.zxgwellness.com/api/stripe-webhook`
- Payload style: Snapshot

The Stripe webhook signing secret must be saved in Vercel as the environment variable expected by the project. This secret normally starts with `whsec_`.

The Stripe API version shown during setup is not the webhook secret. Selecting the account's current/default supported version was appropriate.

### Verification completed

An automated test now checks that:

- A correctly signed Stripe message is accepted.
- An invalid Stripe signature is rejected.

The Stripe signature smoke test passed.

---

## 2. Contact form repaired

### Problem found

The old contact form did not send or store a message. It stopped the browser from refreshing and immediately displayed “Message received.”

This meant customers believed their message had been delivered even though no message was sent anywhere.

### Possible business effect

- Customer questions could be lost.
- Product questions could go unanswered.
- Wholesale, partnership, and support inquiries could disappear.
- Customers might lose trust after receiving no reply.

### Correction completed

A real contact service was created.

The new form:

- Sends the customer's information to a protected website endpoint.
- Validates required information.
- Sends the message using Resend.
- Shows success only after the website confirms delivery.
- Shows an understandable error if delivery fails.
- Includes protection against automated spam.
- Limits repeated submissions.
- Does not expose private email-service errors to visitors.

### Contact-page design improvement

The contact page was redesigned to feel more polished and useful.

It now includes:

- A two-column layout on larger screens.
- The customer-provided feature video next to the form.
- A clear explanation of what customers can contact ZXG Wellness about.
- Better spacing and visual hierarchy.
- A proper loading state while a message is being sent.
- Clear success and error responses.

The supplied video was optimized from the original file and added as a website asset.

### Required Vercel settings

The contact-email system uses:

- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`

The email value should be entered without angle brackets unless a sender name is included in the complete supported format.

Example:

`orders@zxgwellness.com`

The sending domain must also be approved in Resend.

### Verification completed

The automated contact test passed.

---

## 3. Newsletter and email capture added

### Problem found

The site had no working method to collect emails from interested visitors.

For an online wellness brand, an email list can help with:

- Product announcements
- Educational articles
- New product launches
- Returning-customer offers
- Long-term customer relationships

### Correction completed

A newsletter signup was added to the footer.

It includes:

- An email field
- Clear permission language
- A required consent checkbox
- Sending, success, and error states
- A protected newsletter endpoint
- Resend contact-list integration
- Spam and repeated-request protection

The form does not quietly subscribe people without their permission.

### Verification completed

The newsletter-consent and submission smoke tests passed.

---

## 4. Google SEO foundation improved

### Original problem

The website was mainly built in the visitor's browser. When a visitor opened a page, the server initially returned a general HTML file, and JavaScript later created the page-specific title, description, social image, and Google product or article information.

Google can often run JavaScript, but this creates delays and is less dependable for:

- Social-media preview systems
- Messaging apps
- Smaller search crawlers
- Crawlers that do not wait for product information to load

Product pages were especially affected because their SEO information did not appear until product data finished loading.

### Possible business effect

- A product link could show the general homepage title instead of the product title.
- Shared links could use the wrong description or picture.
- Google could take longer to understand a page.
- Carefully written product and article information would not deliver its full benefit.
- Search visibility could be weaker than necessary.

### Correction completed

A production preparation process now creates complete SEO HTML for 19 important public pages during every Vercel build.

This means crawlers can receive important information immediately, including:

- A unique page title
- A unique page description
- The correct page address
- Social-sharing title and description
- Social-sharing image
- Product information for product pages
- Article information for blog pages
- Breadcrumb information

This is static pre-rendering. In simple terms, the important public pages are prepared before visitors and search engines request them.

### SEO image correction

The general social-sharing image previously used a fragile path containing spaces. A dedicated compressed WebP social image was created and used instead.

### Search Console preparation

Support was added for Google site-verification information through:

`VITE_GOOGLE_SITE_VERIFICATION`

The user correctly created a Google Search Console Domain property for:

`zxgwellness.com`

Because GoDaddy warned that automatic Google authorization could affect the existing Microsoft 365/Outlook mail setup, the safe recommendation was not to grant broad automatic mail setup access. Domain verification should not be allowed to replace or remove existing Outlook email records.

The sitemap to submit in Search Console is:

`https://www.zxgwellness.com/sitemap.xml`

### Important clarification

Passing an SEO or rich-results test makes a page understandable and eligible. It does not guarantee a particular ranking or guarantee that Google will display a special result.

Rankings also depend on:

- Helpful original content
- Competition
- Website reputation
- Genuine links from other websites
- Customer demand
- Page experience
- Time

---

## 5. Product information for Google corrected

### First test result

The first product Rich Results screenshot showed:

- Five valid detected items in total
- Two Product results
- Two Merchant Listing results
- One Breadcrumb result

The green checks proved that the information was valid, but the product appeared twice.

### Why it happened

One copy came from the prepared HTML sent by the server. A second copy was created when the browser's JavaScript started.

Although both copies were valid, duplicate product information was unnecessary and could make the page less clear to search systems.

### Correction completed

The prepared product information remains available to crawlers that do not run JavaScript.

When JavaScript does run, the prepared copy is removed before the live page adds its current product information. This prevents duplicate Product and Merchant Listing entries.

### Successful retest

The later screenshots showed:

- One valid Product item
- One valid Merchant Listing item
- Successful crawling
- No critical errors

This confirmed that the duplicate correction worked in production.

### Optional product notices

Google still displayed optional notices for:

- `review`
- `aggregateRating`
- `shippingDetails`
- `hasMerchantReturnPolicy`

These are not errors.

They should only be added when ZXG Wellness has accurate supporting information:

- Genuine customer reviews
- A real average rating
- Exact shipping regions, prices, and delivery estimates
- A precise return policy

No ratings or reviews were invented simply to remove a warning. False review information could violate Google's rules and harm customer trust.

---

## 6. Blog article information for Google corrected

### First article test

The article Rich Results screenshot showed:

- One valid Article
- One valid Breadcrumb
- A successful crawl

Google also showed four non-critical date notices.

### Date problem

The article used dates such as:

`2026-06-29`

Google requested a more complete date that included the time and timezone.

### Correction completed

The article's published and updated dates were changed in Google-facing information to complete values such as:

`2026-06-29T00:00:00Z`

This was corrected in both:

- The prepared HTML
- The live browser-generated article information

The date displayed to normal visitors remains readable.

### Verification completed

The generated production page was checked directly and contained:

- A complete published date
- A complete modified date
- A timezone

The build and tests passed before deployment.

---

## 7. Social-media presence added

### Request

The user wanted social-media icons placed where visitors naturally expect them.

At the time, Instagram was the only confirmed account.

### Correction completed

Instagram was added to:

- The website footer
- The contact page

The link is controlled by:

`VITE_INSTAGRAM_URL`

Facebook and TikTok were not displayed because real account addresses had not been supplied. Empty or placeholder accounts should not be shown publicly.

When additional real profiles become available, their Vercel variables can be added and the site can be extended safely.

### Google business identity

The confirmed social profile can also be included in the website's organization information so Google can connect the website and the official social account.

---

## 8. Frequently asked questions added

### Request

The user requested FAQs but wanted the placement decided based on the design and customer journey.

### Correction completed

FAQs were placed on the contact page, where visitors commonly go when they still have questions.

The section:

- Answers common customer concerns.
- Reduces unnecessary support requests.
- Helps customers understand how to get assistance.
- Uses FAQ-formatted page information so search systems can understand the questions and answers.

FAQ information does not guarantee a special Google display, but it improves page clarity and supports customer education.

---

## 9. Image cleanup and optimization

### Problem found

The repository contained duplicate image folders with the same files under differently capitalized names.

Several original PNG files were very large:

- Some product pictures were approximately 1.7–2.4 MB each.
- The original footer logo was 6250 × 6250 pixels and approximately 377 KB in the production output.
- Large pictures increased download time, particularly on mobile connections.

### Correction completed

Compressed WebP versions were created and used for:

- Creatine front and back images
- Body Balm images
- Reusable pen colors
- Syringe
- Cartridge
- Pen needles

Examples from the production build:

- Reusable pen images: approximately 11–23 KB
- Needles: approximately 35 KB
- Cartridge: approximately 50 KB
- Body Balm: approximately 77 KB
- Larger creatine images: approximately 169–195 KB

The logo delivery was also improved:

- Header logo: approximately 5.6 KB
- Footer logo: approximately 22 KB

The original source files were preserved where removing them could create unnecessary risk. The website now imports the optimized copies.

### Additional image corrections

- Important images now include clear width and height information.
- Customer profile images request smaller versions appropriate for their display size.
- Below-the-page video artwork is not downloaded before the section is close to the visitor's screen.
- Product image descriptions were improved where relevant.

These changes reduce unnecessary downloads and help prevent page movement while images load.

---

## 10. Mobile speed improvements

### Original PageSpeed screenshot

The first mobile PageSpeed report showed:

- Performance: 63
- Accessibility: 93
- Best Practices: 100
- SEO: 100
- First Contentful Paint: 3.1 seconds
- Largest Contentful Paint: 10.6 seconds
- Total Blocking Time: 180 milliseconds
- Speed Index: 5.2 seconds

The report also identified:

- Requests delaying the first display
- Inefficient image delivery
- Unused JavaScript
- Images without fixed dimensions
- Long tasks
- Forced page recalculation
- Missing source maps

### Main causes found

#### Important homepage text was initially invisible

The main homepage message started at zero visibility and waited for JavaScript animation before appearing.

This made the page look intentionally elegant, but it also caused the speed test to treat the most important content as late.

#### Google Fonts were loaded through the main CSS file

The font request delayed the first visual display.

#### Every website section was included in the first JavaScript bundle

The browser received code for pages the visitor had not opened, including:

- Admin screens
- Account pages
- Checkout
- Blog routes
- Product-management tools

This made the first download and browser processing unnecessarily heavy.

#### Oversized and early-loaded media

The footer logo was much larger than needed.

A video picture far below the first screen could also be requested before it was useful.

### Corrections completed

#### Route-level loading

The website now separates page code into smaller pieces.

The homepage no longer forces the visitor to immediately download the full code for every other page.

The homepage-specific piece became approximately 33 KB, while admin and other large sections are downloaded only when needed.

#### Faster first display

The main homepage heading is no longer hidden while waiting for JavaScript animation.

Decorative animation remains elsewhere, but the most important content is immediately visible.

#### Better font loading

The blocking font import was removed from the main CSS file.

The browser now connects to the font services early and loads the font stylesheet without holding back the entire page.

#### Better media loading

- Logos were resized.
- Images received proper dimensions.
- The lower video image waits until the video section is near.
- Smaller customer images are requested.

### Final PageSpeed screenshot

After deployment, the mobile report showed:

- Performance: 80
- Accessibility: 96
- Best Practices: 100
- SEO: 100
- Agentic Browsing: 2/2
- First Contentful Paint: approximately 2.2 seconds
- Largest Contentful Paint: approximately 4.1 seconds

Desktop performance was reported as 99.

### How to understand the mobile score

The mobile score is not “80% of the website works.”

PageSpeed intentionally tests the page as though it were using:

- A slower mobile processor
- A slower mobile network
- A fresh visit without previously downloaded files

Desktop receives much faster simulated hardware and network access, so a higher desktop result is expected.

The change from 63 to 80 is a substantial improvement. PageSpeed scores can move between runs even when the code does not change.

---

## 11. Accessibility improvements

### Problems shown in the original report

The first report identified:

- Prohibited accessibility labels
- Insufficient color contrast
- A video-caption manual check
- A malformed accessibility tree for automated agents

### Corrections completed

- Incorrect labeling around customer images was removed.
- Star ratings now clearly announce “5 out of 5 stars.”
- Homepage slideshow controls now explain which product they show.
- Slideshow controls identify whether they are currently selected.
- The mobile-menu button now announces whether it opens or closes the menu.
- The mobile-menu button reports whether the menu is expanded.
- Important images include dimensions and useful descriptions.

### Verification

The local production Lighthouse test reached:

- Accessibility: 100
- SEO: 100

The deployed PageSpeed screenshot later showed:

- Accessibility: 96
- Agentic Browsing: 2/2

Differences between local and remote scores can occur because PageSpeed uses a different environment and because third-party content can change.

---

## 12. Website security improvements

### Problem areas addressed

Several website endpoints returned broad access permissions or exposed overly detailed service errors.

The earlier setup also lacked several useful browser security instructions.

### Corrections completed

#### Safer error messages

Raw database and service errors are no longer returned directly to ordinary visitors in the corrected endpoints.

Detailed private error information should remain on the server rather than being shown publicly.

#### Safer cross-website access rules

Shared access rules were created for public endpoints. The site no longer relies on an unrestricted `*` response everywhere that was corrected.

#### Request protection

Contact and newsletter endpoints include:

- Request validation
- Basic spam protection
- Request-rate protection
- Controlled error responses

#### Browser security instructions

Vercel now sends instructions that:

- Require long-term HTTPS use.
- Prevent browsers from guessing incorrect file types.
- Prevent other websites from placing ZXG Wellness inside a hidden frame.
- Limit how much referral information is shared.
- Disable unnecessary camera, microphone, and location access.
- Improve separation between the website and unrelated browser windows.

The Vercel configuration was validated before deployment.

---

## 13. Analytics foundation

### What Vercel Analytics provides

Vercel Analytics is useful for basic website traffic and page-level information.

### Why Google Analytics is different

Google Analytics can help answer:

- Which marketing source brought a visitor
- Which pages they viewed
- Whether they started checkout
- Whether they completed a purchase
- Which campaigns generate sales

### Correction completed

A privacy-conscious Google Analytics foundation was added.

It uses:

`VITE_GA_MEASUREMENT_ID`

Analytics loads only after the visitor gives permission through the website's analytics preferences.

If no real Google Analytics ID is supplied, the feature remains inactive rather than sending information to a placeholder account.

Google Analytics is optional. Vercel Analytics can continue to be used, but it does not replace all sales and advertising measurement features.

---

## 14. Email consistency and private configuration

### Problems found

Different order paths contained different notification recipients, including old website domains.

This could cause order messages to go to different people depending on how the payment was processed.

### Correction completed

Shared email configuration was introduced so corrected services can use consistent sender and recipient settings.

Sensitive settings belong in Vercel environment variables, not in public browser code or GitHub.

Examples include:

- Stripe secret key
- Stripe webhook signing secret
- Resend API key
- Supabase service role key

Public browser settings that begin with `VITE_` should only contain values intended to be visible in the browser.

---

## 15. Testing added and completed

### Automated smoke-test system

A smoke test is a short automated check that confirms the most important services still behave correctly after a change.

The new command is:

`npm run test:smoke`

It checks:

- Contact-form behavior
- Newsletter consent
- Cross-website request rules
- Stripe webhook signatures

### Build testing

The production Vercel build was repeatedly run:

`npm run build:vercel`

Successful results included:

- Approximately 3,000 modules processed
- 19 public SEO pages prepared
- Optimized images included
- Page-level JavaScript files created

### Other completed checks

- Targeted code-quality checks passed for changed files.
- Vercel configuration validation passed.
- Generated HTML was inspected directly.
- Product structured data was counted before deployment.
- Article date values were checked in the generated HTML.
- Google Rich Results screenshots confirmed production behavior.
- Local mobile Lighthouse testing confirmed the accessibility and SEO corrections.

### Existing unrelated code-quality items

A full TypeScript-only check still reports older issues in:

- The admin product form
- The account page
- The reusable-pen comparison page

These older issues do not currently stop the production Vite build. They were not mixed into the performance deployment because changing unrelated admin and account logic at the same time would increase risk.

They should be handled in a separate, focused maintenance pass.

---

## 16. Deployment record

The work was committed and pushed to the main GitHub branch in four major deployments:

### `9ce42d7` — Production reliability, SEO, and contact experience

Included:

- Stripe webhook correction
- Real contact endpoint
- Newsletter signup
- Shared email and web-request protection
- SEO page preparation
- Contact feature video
- Contact-page redesign
- FAQs
- Instagram links
- Google Analytics foundation
- Optimized WebP images
- Automated smoke tests

### `22e30ff` — Duplicate product information correction

Included:

- Removal of duplicate Product information after browser startup
- Preservation of prepared Product information for non-JavaScript crawlers

### `44d4dd3` — Article date correction

Included:

- Complete published and modified dates
- Timezone information
- Correction in prepared and browser-generated article information

### `297b3f7` — Mobile performance and accessibility

Included:

- Page-by-page code loading
- Faster homepage content display
- Faster font loading
- Smaller logos
- Delayed lower-page media
- Image dimensions
- Accessibility corrections
- Caching and browser security instructions

All four commits were pushed to the main repository and deployed through Vercel.

---

## 17. Current condition of the website

### Confirmed working

- Stripe webhook signature handling
- Real contact-form submission
- Newsletter consent and submission
- Google-readable product information
- Google-readable article information
- Product rich-results eligibility
- Article rich-results eligibility
- Breadcrumb information
- Static SEO information on important public pages
- Instagram links
- Contact feature video
- Contact FAQs
- Optimized product images
- Mobile route splitting
- Improved accessibility
- Improved browser security
- Automated smoke tests
- Vercel production builds

### Current measured results

- Desktop PageSpeed performance: 99
- Mobile PageSpeed performance: 80
- Best Practices: 100
- SEO: 100
- Agentic Browsing: 2/2
- Product and article Rich Results: valid

### Items requiring real owner information

- Genuine customer reviews and ratings
- Exact shipping rules
- Exact return-policy information for Google
- Facebook profile, if created
- TikTok profile, if created
- Google Analytics measurement ID, if Google Analytics is desired
- Google Search Console sitemap submission and indexing requests
- Ongoing review of Stripe's webhook delivery history

### Recommended next maintenance work

1. Monitor Stripe webhook deliveries after real payments.
2. Test the contact form using a real outside email address.
3. Confirm newsletter contacts appear in Resend.
4. Submit the sitemap in Google Search Console.
5. Request indexing for the homepage, main products, and strongest articles.
6. Publish useful product and troubleshooting articles consistently.
7. Add genuine reviews only after customers submit them.
8. Add shipping and return information only after the business rules are final.
9. Address the older TypeScript issues in a separate maintenance change.
10. Review real visitor Core Web Vitals after enough traffic has been collected.

---

## Final outcome

ZXG Wellness moved from a visually polished but technically fragile client-rendered storefront to a more dependable ecommerce website with:

- Protected Stripe notifications
- Working customer contact
- Email capture
- Search-engine-ready public pages
- Valid product and article information
- Better social visibility
- Smaller media
- Faster mobile loading
- Better accessibility
- Stronger browser security
- Repeatable automated testing

The work focused on real customer and business risks first, followed by search visibility and measurable performance improvements. No fake reviews, ratings, social accounts, shipping promises, or business policies were added.
