/**
 * Minimal Resume Template
 * 
 * Ultra-clean design with generous whitespace and subtle typography.
 * Best for: Designers, creatives, and roles where simplicity is valued.
 */

export const minimalTemplateHtml = `<main>
<header>
  <h1>{{basics.name}}</h1>
  {{#if basics.label}}<p class="label">{{basics.label}}</p>{{/if}}
  <div class="contact">
    {{#if basics.email}}<a href="mailto:{{basics.email}}">{{basics.email}}</a>{{/if}}
    {{#if basics.phone}}<span>{{basics.phone}}</span>{{/if}}
    {{#if basics.url}}<a href="{{basics.url}}">Portfolio</a>{{/if}}
    {{#if basics.profiles}}
      {{#each basics.profiles}}<a href="{{url}}">{{network}}</a>{{/each}}
    {{/if}}
  </div>
</header>

{{#if basics.summary}}
<section class="summary">
  <p>{{basics.summary}}</p>
</section>
{{/if}}

{{#if work}}
<section>
  <h3>Experience</h3>
  {{#each work}}
  <article>
    <div class="row">
      <div class="left">
        <strong>{{position}}</strong>
        <span class="org">{{name}}</span>
      </div>
      {{#if startDate}}<time>{{startDate}} — {{#if endDate}}{{endDate}}{{else}}Present{{/if}}</time>{{/if}}
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
    <div class="row">
      <div class="left">
        <strong>{{position}}</strong>
        <span class="org">{{organization}}</span>
      </div>
      {{#if startDate}}<time>{{startDate}} — {{#if endDate}}{{endDate}}{{else}}Present{{/if}}</time>{{/if}}
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
    <div class="row">
      <strong>{{#if url}}<a href="{{url}}">{{name}}</a>{{else}}{{name}}{{/if}}</strong>
      {{#if startDate}}<time>{{startDate}}{{#if endDate}} — {{endDate}}{{/if}}</time>{{/if}}
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
    <div class="row">
      <div class="left">
        <strong>{{studyType}}{{#if area}}, {{area}}{{/if}}</strong>
        <span class="org">{{institution}}</span>
      </div>
      {{#if startDate}}<time>{{startDate}} — {{#if endDate}}{{endDate}}{{else}}Present{{/if}}</time>{{/if}}
    </div>
    {{#if score}}<p class="small">GPA: {{score}}</p>{{/if}}
  </article>
  {{/each}}
</section>
{{/if}}

{{#if skills}}
<section>
  <h3>Skills</h3>
  <div class="skills">
    {{#each skills}}
      <div class="skill">
        <span class="skill-name">{{name}}</span>
        {{#if keywords}}
          <span class="skill-keywords">{{#each keywords}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}</span>
        {{/if}}
      </div>
    {{/each}}
  </div>
</section>
{{/if}}

{{#if languages}}
<section>
  <h3>Languages</h3>
  <div class="tags">
    {{#each languages}}<span class="tag">{{language}}{{#if fluency}} · {{fluency}}{{/if}}</span>{{/each}}
  </div>
</section>
{{/if}}

{{#if interests}}
<section>
  <h3>Interests</h3>
  <div class="tags">
    {{#each interests}}<span class="tag">{{name}}</span>{{/each}}
  </div>
</section>
{{/if}}

{{#if awards}}
<section>
  <h3>Awards</h3>
  {{#each awards}}
  <article>
    <div class="row">
      <strong>{{title}}</strong>
      <time>{{date}}</time>
    </div>
    {{#if awarder}}<p class="small">{{awarder}}</p>{{/if}}
  </article>
  {{/each}}
</section>
{{/if}}

{{#if certificates}}
<section>
  <h3>Certificates</h3>
  {{#each certificates}}
  <article>
    <div class="row">
      <strong>{{#if url}}<a href="{{url}}">{{name}}</a>{{else}}{{name}}{{/if}}</strong>
      <time>{{date}}</time>
    </div>
    {{#if issuer}}<p class="small">{{issuer}}</p>{{/if}}
  </article>
  {{/each}}
</section>
{{/if}}

{{#if publications}}
<section>
  <h3>Publications</h3>
  {{#each publications}}
  <article>
    <div class="row">
      <strong>{{#if url}}<a href="{{url}}">{{name}}</a>{{else}}{{name}}{{/if}}</strong>
      {{#if releaseDate}}<time>{{releaseDate}}</time>{{/if}}
    </div>
    {{#if publisher}}<p class="small">{{publisher}}</p>{{/if}}
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
    {{#if reference}}<p class="reference">{{reference}}</p>{{/if}}
  </article>
  {{/each}}
</section>
{{/if}}

</main>`;

export const minimalTemplateCss = `/* A4-safe wrapper */
@page { size: A4; margin: 0; }
html, body {
  width: 210mm;
  height: 297mm;
  margin: 0;
  padding: 0;
  background: #fff;
  color: #222;
}

/* Main content area */
main {
  box-sizing: border-box;
  width: 100%;
  max-width: 210mm;
  min-height: 297mm;
  padding: 24mm 22mm;
  font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  font-size: 10px;
  line-height: 1.6;
  overflow: hidden;
  color: #222;
}

/* Header */
header {
  margin-bottom: 20px;
  text-align: center;
}

header h1 {
  font-size: 28px;
  margin: 0 0 4px 0;
  font-weight: 300;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: #111;
}

header .label {
  font-size: 12px;
  color: #666;
  margin: 0 0 12px 0;
  font-weight: 400;
}

header .contact {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 6px 20px;
  font-size: 10px;
  color: #555;
}

header .contact a,
header .contact span {
  color: #555;
  text-decoration: none;
}

header .contact a:hover {
  color: #000;
}

/* Summary */
.summary {
  text-align: center;
  max-width: 85%;
  margin: 0 auto 16px auto;
}

.summary p {
  font-size: 11px;
  color: #444;
  line-height: 1.7;
  margin: 0;
}

/* Section headings */
section > h3 {
  font-size: 9px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 2px;
  margin-top: 18px;
  margin-bottom: 10px;
  padding-bottom: 6px;
  border-bottom: 1px solid #ddd;
  color: #888;
}

/* Article block */
article {
  margin-bottom: 10px;
}

.row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}

.left {
  display: flex;
  flex-direction: column;
}

article strong {
  font-size: 11px;
  font-weight: 600;
  color: #111;
}

.org {
  font-size: 10px;
  color: #666;
  font-weight: 400;
}

article time {
  font-size: 9px;
  color: #888;
  white-space: nowrap;
}

article > p,
article p {
  margin: 4px 0;
  font-size: 10px;
  color: #444;
}

.small {
  font-size: 9px;
  color: #666;
  margin: 2px 0;
}

/* Lists */
ul {
  margin: 6px 0 0 14px;
  padding: 0;
}

li {
  margin-bottom: 2px;
  font-size: 10px;
  color: #444;
}

li::marker {
  color: #ccc;
}

/* Skills */
.skills {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.skill {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.skill-name {
  font-size: 10px;
  font-weight: 600;
  color: #222;
  min-width: 100px;
}

.skill-keywords {
  font-size: 10px;
  color: #555;
}

/* Tags */
.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.tag {
  font-size: 9px;
  color: #555;
  background: #f7f7f7;
  padding: 3px 10px;
  border-radius: 12px;
}

/* Reference quote */
.reference {
  font-style: italic;
  color: #555;
  font-size: 10px;
  margin-top: 4px;
}

/* Links */
article a {
  color: #222;
  text-decoration: none;
  border-bottom: 1px solid #ddd;
}

article a:hover {
  border-bottom-color: #222;
}

/* Print adjustments */
@media print {
  main { padding: 20mm; }
  section, article, header, footer, p, ul, li { page-break-inside: avoid; }
}`;
