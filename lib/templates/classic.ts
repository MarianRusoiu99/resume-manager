/**
 * Classic Resume Template
 * 
 * Traditional serif-based design with clean typography.
 * Best for: Corporate, legal, academic, and traditional industries.
 */

export const classicTemplateHtml = `<main>
<header>
  <h1>{{basics.name}}</h1>
  {{#if basics.label}}<h2>{{basics.label}}</h2>{{/if}}
  <p class="contact">
    {{#if basics.phone}}{{basics.phone}}{{/if}}
    {{#if basics.email}}{{#if basics.phone}} · {{/if}}<a href="mailto:{{basics.email}}">{{basics.email}}</a>{{/if}}
    {{#if basics.url}}{{#if basics.email}}{{/if}} {{#if basics.phone}} · {{/if}}<a href="{{basics.url}}">{{basics.url}}</a>{{/if}}
    {{#if basics.profiles}}
      {{#each basics.profiles}} · <a href="{{url}}">{{network}}{{#if username}} ({{username}}){{/if}}</a>{{/each}}
    {{/if}}
  </p>
</header>

{{#if basics.summary}}
<section>
  <h3>SUMMARY</h3>
  <article>
    <p>{{basics.summary}}</p>
  </article>
</section>
{{/if}}

{{#if work}}
<section>
  <h3>EXPERIENCE</h3>
  {{#each work}}
  <article>
    <strong>{{position}}</strong> — <span>{{name}}</span>
    {{#if startDate}}
      <time>{{startDate}}{{#if endDate}} – {{endDate}}{{/if}}</time>
    {{/if}}
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
  <h3>VOLUNTEER</h3>
  {{#each volunteer}}
  <article>
    <strong>{{position}}</strong> — <span>{{organization}}</span>
    {{#if startDate}}<time>{{startDate}}{{#if endDate}} – {{endDate}}{{/if}}</time>{{/if}}
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
  <h3>PROJECTS</h3>
  {{#each projects}}
  <article>
    <strong><a href="{{url}}">{{name}}</a></strong>
    {{#if startDate}}<time>{{startDate}}{{#if endDate}} – {{endDate}}{{/if}}</time>{{/if}}
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
  <h3>EDUCATION</h3>
  {{#each education}}
  <article>
    <strong>{{studyType}} {{#if area}}— {{area}}{{/if}}</strong>
    <div>{{institution}}</div>
    {{#if startDate}}<time>{{startDate}}{{#if endDate}} – {{endDate}}{{/if}}</time>{{/if}}
    {{#if score}}<div class="meta">Score: {{score}}</div>{{/if}}
    {{#if courses}}
      <ul>{{#each courses}}<li>{{this}}</li>{{/each}}</ul>
    {{/if}}
  </article>
  {{/each}}
</section>
{{/if}}

{{#if skills}}
<section>
  <h3>SKILLS</h3>
  <article>
    {{#each skills}}
      <div>
        <strong>{{name}}</strong>{{#if level}} — <small>{{level}}</small>{{/if}}
        {{#if keywords}}
          <div>
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
  <h3>LANGUAGES</h3>
  <article>
    <ul>{{#each languages}}<li>{{language}}{{#if fluency}} — {{fluency}}{{/if}}</li>{{/each}}</ul>
  </article>
</section>
{{/if}}

{{#if interests}}
<section>
  <h3>INTERESTS</h3>
  <article>
    <ul>{{#each interests}}<li>{{name}}{{#if keywords}} — {{#each keywords}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}{{/if}}</li>{{/each}}</ul>
  </article>
</section>
{{/if}}

{{#if awards}}
<section>
  <h3>AWARDS</h3>
  <article>
    <ul>{{#each awards}}<li><strong>{{title}}</strong> — {{date}} {{#if awarder}}• {{awarder}}{{/if}}{{#if summary}} — {{summary}}{{/if}}</li>{{/each}}</ul>
  </article>
</section>
{{/if}}

{{#if certificates}}
<section>
  <h3>CERTIFICATES</h3>
  <article>
    <ul>{{#each certificates}}<li><strong>{{name}}</strong> — {{date}}{{#if issuer}} • {{issuer}}{{/if}}{{#if url}} • <a href="{{url}}">link</a>{{/if}}</li>{{/each}}</ul>
  </article>
</section>
{{/if}}

{{#if publications}}
<section>
  <h3>PUBLICATIONS</h3>
  <article>
    <ul>{{#each publications}}<li><strong>{{name}}</strong> — {{publisher}} {{#if releaseDate}}• {{releaseDate}}{{/if}} {{#if url}}• <a href="{{url}}">link</a>{{/if}}</li>{{/each}}</ul>
  </article>
</section>
{{/if}}

{{#if references}}
<section>
  <h3>REFERENCES</h3>
  <article>
    <ul>{{#each references}}<li><strong>{{name}}</strong>{{#if reference}} — {{reference}}{{/if}}</li>{{/each}}</ul>
  </article>
</section>
{{/if}}

</main>`;

export const classicTemplateCss = `/* A4-safe wrapper */
@page { size: A4; margin: 0; }
html, body {
  width: 210mm;
  height: 297mm;
  margin: 0;
  padding: 0;
  background: #fff;
  color: #111;
}

/* Main content area */
main {
  box-sizing: border-box;
  width: 100%;
  max-width: 210mm;
  min-height: 297mm;
  padding: 16mm;
  font-family: "Times New Roman", Georgia, serif;
  font-size: 12px;
  line-height: 1.35;
  overflow: hidden;
  color: #111;
}

/* Header */
header h1 {
  font-size: 28px;
  margin-bottom: 3px;
  font-weight: 700;
}

header h2 {
  font-size: 14px;
  color: #333;
  margin-bottom: 5px;
  font-weight: 400;
}

header .contact {
  font-size: 12px;
  margin-bottom: 8px;
}

header a { color: inherit; text-decoration: none; }

/* Section headings */
section > h3 {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.8px;
  margin-top: 12px;
  margin-bottom: 6px;
  padding-bottom: 5px;
  border-bottom: 1px solid #222;
}

/* Article block */
article {
  margin-bottom: 8px;
}

article strong,
article span {
  font-size: 12px;
  font-weight: 700;
}

article time {
  display: block;
  font-size: 11px;
  color: #444;
  margin-top: 1px;
}

article > p {
  margin-top: 4px;
  margin-bottom: 4px;
  font-size: 12px;
}

/* Lists */
ul {
  margin-left: 16px;
  margin-top: 4px;
}

li {
  margin-bottom: 3px;
  font-size: 11.5px;
}

/* Skill keywords */
.keyword {
  display: inline-block;
  background: #f4f4f4;
  border-radius: 3px;
  padding: 1px 5px;
  font-size: 10px;
  color: #333;
  margin-right: 5px;
  margin-top: 3px;
}

/* Meta text */
.meta {
  font-size: 11px;
  color: #555;
}

/* Print adjustments */
@media print {
  main { padding: 14mm; }
  section, article, header, footer, p, ul, li { page-break-inside: avoid; }
}`;
