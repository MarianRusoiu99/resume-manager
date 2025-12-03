/**
 * Modern Resume Template
 * 
 * Clean sans-serif design with blue accent colors and modern typography.
 * Best for: Tech, startups, design, and progressive companies.
 */

export const modernTemplateHtml = `<main>
<header>
  <h1>{{basics.name}}</h1>
  {{#if basics.label}}<h2>{{basics.label}}</h2>{{/if}}
  <div class="contact">
    {{#if basics.phone}}<span class="contact-item">{{basics.phone}}</span>{{/if}}
    {{#if basics.email}}<span class="contact-item"><a href="mailto:{{basics.email}}">{{basics.email}}</a></span>{{/if}}
    {{#if basics.url}}<span class="contact-item"><a href="{{basics.url}}">{{basics.url}}</a></span>{{/if}}
    {{#if basics.profiles}}
      {{#each basics.profiles}}<span class="contact-item"><a href="{{url}}">{{network}}{{#if username}} ({{username}}){{/if}}</a></span>{{/each}}
    {{/if}}
  </div>
</header>

{{#if basics.summary}}
<section>
  <h3>Summary</h3>
  <article>
    <p>{{basics.summary}}</p>
  </article>
</section>
{{/if}}

{{#if work}}
<section>
  <h3>Experience</h3>
  {{#each work}}
  <article>
    <div class="article-header">
      <div class="title-company">
        <strong>{{position}}</strong>
        <span class="company">{{name}}</span>
      </div>
      {{#if startDate}}
        <time>{{startDate}}{{#if endDate}} – {{endDate}}{{else}} – Present{{/if}}</time>
      {{/if}}
    </div>
    {{#if summary}}<p>{{summary}}</p>{{/if}}
    {{#if highlights}}
      <ul>
        {{#each highlights}}<li>{{this}}</li>{{/each}}
      </ul>
    {{/if}}
  </article>
  {{/each}}
</section>
{{/if}}

{{#if volunteer}}
<section>
  <h3>Volunteer</h3>
  {{#each volunteer}}
  <article>
    <div class="article-header">
      <div class="title-company">
        <strong>{{position}}</strong>
        <span class="company">{{organization}}</span>
      </div>
      {{#if startDate}}<time>{{startDate}}{{#if endDate}} – {{endDate}}{{else}} – Present{{/if}}</time>{{/if}}
    </div>
    {{#if summary}}<p>{{summary}}</p>{{/if}}
    {{#if highlights}}
      <ul>{{#each highlights}}<li>{{this}}</li>{{/each}}</ul>
    {{/if}}
  </article>
  {{/each}}
</section>
{{/if}}

{{#if projects}}
<section>
  <h3>Projects</h3>
  {{#each projects}}
  <article>
    <div class="article-header">
      <strong>{{#if url}}<a href="{{url}}">{{name}}</a>{{else}}{{name}}{{/if}}</strong>
      {{#if startDate}}<time>{{startDate}}{{#if endDate}} – {{endDate}}{{/if}}</time>{{/if}}
    </div>
    {{#if description}}<p>{{description}}</p>{{/if}}
    {{#if highlights}}
      <ul>{{#each highlights}}<li>{{this}}</li>{{/each}}</ul>
    {{/if}}
  </article>
  {{/each}}
</section>
{{/if}}

{{#if education}}
<section>
  <h3>Education</h3>
  {{#each education}}
  <article>
    <div class="article-header">
      <div class="title-company">
        <strong>{{studyType}}{{#if area}} in {{area}}{{/if}}</strong>
        <span class="company">{{institution}}</span>
      </div>
      {{#if startDate}}<time>{{startDate}}{{#if endDate}} – {{endDate}}{{/if}}</time>{{/if}}
    </div>
    {{#if score}}<div class="meta">GPA: {{score}}</div>{{/if}}
    {{#if courses}}
      <ul>{{#each courses}}<li>{{this}}</li>{{/each}}</ul>
    {{/if}}
  </article>
  {{/each}}
</section>
{{/if}}

{{#if skills}}
<section>
  <h3>Skills</h3>
  <article class="skills-grid">
    {{#each skills}}
      <div class="skill-group">
        <strong>{{name}}</strong>{{#if level}} <span class="level">{{level}}</span>{{/if}}
        {{#if keywords}}
          <div class="keywords">
            {{#each keywords}}<span class="keyword">{{this}}</span>{{/each}}
          </div>
        {{/if}}
      </div>
    {{/each}}
  </article>
</section>
{{/if}}

{{#if languages}}
<section>
  <h3>Languages</h3>
  <article>
    <div class="inline-list">
      {{#each languages}}<span class="inline-item">{{language}}{{#if fluency}} <span class="level">({{fluency}})</span>{{/if}}</span>{{/each}}
    </div>
  </article>
</section>
{{/if}}

{{#if interests}}
<section>
  <h3>Interests</h3>
  <article>
    <div class="inline-list">
      {{#each interests}}<span class="inline-item">{{name}}</span>{{/each}}
    </div>
  </article>
</section>
{{/if}}

{{#if awards}}
<section>
  <h3>Awards</h3>
  {{#each awards}}
  <article>
    <div class="article-header">
      <strong>{{title}}</strong>
      <time>{{date}}</time>
    </div>
    {{#if awarder}}<div class="meta">{{awarder}}</div>{{/if}}
    {{#if summary}}<p>{{summary}}</p>{{/if}}
  </article>
  {{/each}}
</section>
{{/if}}

{{#if certificates}}
<section>
  <h3>Certificates</h3>
  {{#each certificates}}
  <article>
    <div class="article-header">
      <strong>{{#if url}}<a href="{{url}}">{{name}}</a>{{else}}{{name}}{{/if}}</strong>
      <time>{{date}}</time>
    </div>
    {{#if issuer}}<div class="meta">{{issuer}}</div>{{/if}}
  </article>
  {{/each}}
</section>
{{/if}}

{{#if publications}}
<section>
  <h3>Publications</h3>
  {{#each publications}}
  <article>
    <div class="article-header">
      <strong>{{#if url}}<a href="{{url}}">{{name}}</a>{{else}}{{name}}{{/if}}</strong>
      {{#if releaseDate}}<time>{{releaseDate}}</time>{{/if}}
    </div>
    {{#if publisher}}<div class="meta">{{publisher}}</div>{{/if}}
  </article>
  {{/each}}
</section>
{{/if}}

{{#if references}}
<section>
  <h3>References</h3>
  {{#each references}}
  <article>
    <strong>{{name}}</strong>
    {{#if reference}}<p class="quote">{{reference}}</p>{{/if}}
  </article>
  {{/each}}
</section>
{{/if}}

</main>`;

export const modernTemplateCss = `/* A4-safe wrapper */
@page { size: A4; margin: 0; }
html, body {
  width: 210mm;
  height: 297mm;
  margin: 0;
  padding: 0;
  background: #fff;
  color: #1a1a1a;
}

/* Main content area */
main {
  box-sizing: border-box;
  width: 100%;
  max-width: 210mm;
  min-height: 297mm;
  padding: 18mm 20mm;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  font-size: 11px;
  line-height: 1.5;
  overflow: hidden;
  color: #1a1a1a;
}

/* Header */
header {
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 2px solid #2563eb;
}

header h1 {
  font-size: 32px;
  margin: 0 0 4px 0;
  font-weight: 700;
  color: #1a1a1a;
  letter-spacing: -0.5px;
}

header h2 {
  font-size: 16px;
  color: #2563eb;
  margin: 0 0 8px 0;
  font-weight: 500;
}

header .contact {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 16px;
  font-size: 11px;
  color: #4b5563;
}

header .contact-item {
  display: inline-flex;
  align-items: center;
}

header a { 
  color: #2563eb; 
  text-decoration: none; 
}

header a:hover {
  text-decoration: underline;
}

/* Section headings */
section > h3 {
  font-size: 13px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-top: 14px;
  margin-bottom: 8px;
  padding-bottom: 4px;
  border-bottom: 1px solid #e5e7eb;
  color: #2563eb;
}

/* Article block */
article {
  margin-bottom: 10px;
}

.article-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2px;
}

.title-company {
  display: flex;
  flex-direction: column;
}

article strong {
  font-size: 12px;
  font-weight: 600;
  color: #1a1a1a;
}

.company {
  font-size: 11px;
  color: #4b5563;
  font-weight: 400;
}

article time {
  font-size: 10px;
  color: #6b7280;
  white-space: nowrap;
}

article > p {
  margin-top: 4px;
  margin-bottom: 4px;
  font-size: 11px;
  color: #374151;
}

/* Lists */
ul {
  margin: 4px 0 0 16px;
  padding: 0;
}

li {
  margin-bottom: 2px;
  font-size: 11px;
  color: #374151;
}

li::marker {
  color: #2563eb;
}

/* Skills */
.skills-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.skill-group {
  flex: 1 1 45%;
  min-width: 140px;
}

.skill-group strong {
  font-size: 11px;
}

.level {
  font-size: 10px;
  color: #6b7280;
  font-weight: 400;
}

.keywords {
  margin-top: 4px;
}

.keyword {
  display: inline-block;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 4px;
  padding: 2px 6px;
  font-size: 9px;
  color: #1e40af;
  margin-right: 4px;
  margin-top: 2px;
}

/* Inline lists */
.inline-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.inline-item {
  font-size: 11px;
  color: #374151;
}

/* Meta text */
.meta {
  font-size: 10px;
  color: #6b7280;
}

/* Quote for references */
.quote {
  font-style: italic;
  color: #4b5563;
  border-left: 2px solid #2563eb;
  padding-left: 8px;
  margin: 4px 0;
}

/* Links in content */
article a {
  color: #2563eb;
  text-decoration: none;
}

article a:hover {
  text-decoration: underline;
}

/* Print adjustments */
@media print {
  main { padding: 16mm 18mm; }
  section, article, header, footer, p, ul, li { page-break-inside: avoid; }
}`;
