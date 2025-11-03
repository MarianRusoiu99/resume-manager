/**
 * Minimal Template - Clean and modern design with lots of white space
 * Perfect for designers and creative professionals
 */

export const minimalTemplateHtml = `
<div class="resume">
  <header class="header">
    {{#if basics.name}}
      <h1 class="name">{{basics.name}}</h1>
    {{/if}}
    
    {{#if basics.label}}
      <p class="label">{{basics.label}}</p>
    {{/if}}
    
    <div class="contact">
      {{#if basics.email}}<span>{{basics.email}}</span>{{/if}}
      {{#if basics.phone}}<span>{{basics.phone}}</span>{{/if}}
      {{#if basics.location}}<span>{{formatLocation basics.location}}</span>{{/if}}
    </div>
  </header>

  {{#if basics.summary}}
    <section class="section">
      <p class="summary">{{basics.summary}}</p>
    </section>
  {{/if}}

  {{#if (hasItems work)}}
    <section class="section">
      <h2 class="section-title">Experience</h2>
      {{#each work}}
        <div class="item">
          <div class="item-header">
            {{#if position}}<h3 class="item-title">{{position}}</h3>{{/if}}
            <span class="item-date">{{dateRange startDate endDate}}</span>
          </div>
          {{#if name}}<p class="item-subtitle">{{name}}</p>{{/if}}
          {{#if summary}}<p class="item-text">{{summary}}</p>{{/if}}
          {{#if (hasItems highlights)}}
            <ul class="item-list">
              {{#each highlights}}<li>{{this}}</li>{{/each}}
            </ul>
          {{/if}}
        </div>
      {{/each}}
    </section>
  {{/if}}

  {{#if (hasItems skills)}}
    <section class="section">
      <h2 class="section-title">Skills</h2>
      <div class="skills">
        {{#each skills}}
          {{#if name}}
            <span class="skill">{{name}}</span>
          {{/if}}
        {{/each}}
      </div>
    </section>
  {{/if}}

  {{#if (hasItems education)}}
    <section class="section">
      <h2 class="section-title">Education</h2>
      {{#each education}}
        <div class="item">
          <div class="item-header">
            {{#if studyType}}{{#if area}}
              <h3 class="item-title">{{studyType}}, {{area}}</h3>
            {{else}}
              <h3 class="item-title">{{studyType}}</h3>
            {{/if}}{{else}}{{#if area}}
              <h3 class="item-title">{{area}}</h3>
            {{/if}}{{/if}}
            <span class="item-date">{{dateRange startDate endDate}}</span>
          </div>
          {{#if institution}}<p class="item-subtitle">{{institution}}</p>{{/if}}
        </div>
      {{/each}}
    </section>
  {{/if}}

  {{#if (hasItems projects)}}
    <section class="section">
      <h2 class="section-title">Projects</h2>
      {{#each projects}}
        <div class="item">
          <div class="item-header">
            {{#if name}}<h3 class="item-title">{{name}}</h3>{{/if}}
            {{#if startDate}}
              <span class="item-date">{{dateRange startDate endDate}}</span>
            {{/if}}
          </div>
          {{#if description}}<p class="item-text">{{description}}</p>{{/if}}
        </div>
      {{/each}}
    </section>
  {{/if}}
</div>
`;

export const minimalTemplateCss = `
.resume {
  max-width: 700px;
  margin: 0 auto;
  padding: 60px 40px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
  color: #2c2c2c;
  background: #ffffff;
}

/* Header */
.header {
  margin-bottom: 60px;
}

.name {
  font-size: 42px;
  font-weight: 300;
  letter-spacing: -1px;
  margin: 0 0 12px 0;
  color: #1a1a1a;
}

.label {
  font-size: 18px;
  font-weight: 400;
  color: #666;
  margin: 0 0 20px 0;
}

.contact {
  font-size: 14px;
  color: #888;
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}

/* Summary */
.summary {
  font-size: 16px;
  line-height: 1.8;
  color: #444;
  margin: 0;
}

/* Sections */
.section {
  margin-bottom: 50px;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 2px;
  margin: 0 0 30px 0;
  color: #1a1a1a;
}

/* Items */
.item {
  margin-bottom: 32px;
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 8px;
  gap: 20px;
}

.item-title {
  font-size: 18px;
  font-weight: 500;
  margin: 0;
  color: #1a1a1a;
}

.item-subtitle {
  font-size: 15px;
  color: #666;
  margin: 0 0 12px 0;
}

.item-date {
  font-size: 13px;
  color: #999;
  white-space: nowrap;
  flex-shrink: 0;
}

.item-text {
  font-size: 15px;
  line-height: 1.7;
  color: #444;
  margin: 8px 0;
}

.item-list {
  list-style: none;
  padding: 0;
  margin: 12px 0 0 0;
}

.item-list li {
  font-size: 15px;
  line-height: 1.7;
  color: #444;
  margin-bottom: 6px;
  padding-left: 20px;
  position: relative;
}

.item-list li::before {
  content: "—";
  position: absolute;
  left: 0;
  color: #ccc;
}

/* Skills */
.skills {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.skill {
  font-size: 14px;
  color: #666;
  padding: 6px 16px;
  border: 1px solid #e0e0e0;
  border-radius: 20px;
  display: inline-block;
}

/* Print styles */
@media print {
  .resume {
    padding: 30px 20px;
  }
  
  .section {
    page-break-inside: avoid;
  }
  
  .item {
    page-break-inside: avoid;
  }
  
  .item-header {
    page-break-after: avoid;
  }
  
  .section-title {
    page-break-after: avoid;
  }
}
`;
