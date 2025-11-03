/**
 * Modern Template - Clean, professional design
 * Inspired by JSON Resume Modern theme
 */

export const modernTemplateHtml = `
<div class="resume">
  <header class="resume-header">
    {{#if basics.name}}
      <h1 class="name">{{basics.name}}</h1>
    {{/if}}
    
    {{#if basics.label}}
      <h2 class="label">{{basics.label}}</h2>
    {{/if}}
    
    <div class="contact-info">
      {{#if basics.email}}
        <span class="contact-item">✉ {{basics.email}}</span>
      {{/if}}
      {{#if basics.phone}}
        <span class="contact-item">📞 {{basics.phone}}</span>
      {{/if}}
      {{#if basics.location}}
        <span class="contact-item">📍 {{formatLocation basics.location}}</span>
      {{/if}}
      {{#if basics.url}}
        <span class="contact-item">🌐 {{basics.url}}</span>
      {{/if}}
    </div>
    
    {{#if basics.summary}}
      <p class="summary">{{basics.summary}}</p>
    {{/if}}
  </header>

  {{#if (hasItems work)}}
    <section class="section">
      <h3 class="section-title">Work Experience</h3>
      {{#each work}}
        <div class="item">
          <div class="item-header">
            <div>
              {{#if position}}<h4 class="item-title">{{position}}</h4>{{/if}}
              {{#if name}}<p class="item-subtitle">{{name}}</p>{{/if}}
            </div>
            <span class="item-date">{{dateRange startDate endDate}}</span>
          </div>
          {{#if summary}}
            <p class="item-summary">{{summary}}</p>
          {{/if}}
          {{#if (hasItems highlights)}}
            <ul class="highlights">
              {{#each highlights}}
                <li>{{this}}</li>
              {{/each}}
            </ul>
          {{/if}}
        </div>
      {{/each}}
    </section>
  {{/if}}

  {{#if (hasItems education)}}
    <section class="section">
      <h3 class="section-title">Education</h3>
      {{#each education}}
        <div class="item">
          <div class="item-header">
            <div>
              {{#if studyType}}{{#if area}}
                <h4 class="item-title">{{studyType}} in {{area}}</h4>
              {{else}}
                <h4 class="item-title">{{studyType}}</h4>
              {{/if}}{{else}}{{#if area}}
                <h4 class="item-title">{{area}}</h4>
              {{/if}}{{/if}}
              {{#if institution}}<p class="item-subtitle">{{institution}}</p>{{/if}}
            </div>
            <span class="item-date">{{dateRange startDate endDate}}</span>
          </div>
          {{#if score}}
            <p class="item-detail">GPA: {{score}}</p>
          {{/if}}
        </div>
      {{/each}}
    </section>
  {{/if}}

  {{#if (hasItems skills)}}
    <section class="section">
      <h3 class="section-title">Skills</h3>
      <div class="skills-grid">
        {{#each skills}}
          <div class="skill-item">
            {{#if name}}<strong>{{name}}</strong>{{/if}}
            {{#if (hasItems keywords)}}
              <span class="skill-keywords">{{join keywords ", "}}</span>
            {{/if}}
          </div>
        {{/each}}
      </div>
    </section>
  {{/if}}

  {{#if (hasItems projects)}}
    <section class="section">
      <h3 class="section-title">Projects</h3>
      {{#each projects}}
        <div class="item">
          <div class="item-header">
            <div>
              {{#if name}}<h4 class="item-title">{{name}}</h4>{{/if}}
            </div>
            {{#if startDate}}
              <span class="item-date">{{dateRange startDate endDate}}</span>
            {{/if}}
          </div>
          {{#if description}}
            <p class="item-summary">{{description}}</p>
          {{/if}}
          {{#if (hasItems highlights)}}
            <ul class="highlights">
              {{#each highlights}}
                <li>{{this}}</li>
              {{/each}}
            </ul>
          {{/if}}
        </div>
      {{/each}}
    </section>
  {{/if}}
</div>
`;

export const modernTemplateCss = `
.resume {
  max-width: 800px;
  margin: 0 auto;
  padding: 40px;
  background: white;
}

.resume-header {
  border-bottom: 3px solid #2563eb;
  padding-bottom: 30px;
  margin-bottom: 30px;
}

.name {
  font-size: 36px;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 8px;
}

.label {
  font-size: 20px;
  font-weight: 500;
  color: #2563eb;
  margin-bottom: 16px;
}

.contact-info {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 16px;
}

.contact-item {
  font-size: 14px;
  color: #64748b;
}

.summary {
  font-size: 15px;
  line-height: 1.7;
  color: #475569;
  margin-top: 16px;
}

.section {
  margin-bottom: 32px;
}

.section-title {
  font-size: 22px;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 20px;
  padding-bottom: 8px;
  border-bottom: 2px solid #e2e8f0;
}

.item {
  margin-bottom: 24px;
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
  gap: 16px;
}

.item-title {
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 4px;
}

.item-subtitle {
  font-size: 16px;
  color: #475569;
  margin-bottom: 4px;
}

.item-date {
  font-size: 14px;
  color: #64748b;
  white-space: nowrap;
  flex-shrink: 0;
}

.item-summary {
  font-size: 15px;
  line-height: 1.6;
  color: #475569;
  margin-bottom: 8px;
}

.item-detail {
  font-size: 14px;
  color: #64748b;
  margin-top: 4px;
}

.highlights {
  list-style: none;
  padding-left: 0;
  margin-top: 8px;
}

.highlights li {
  font-size: 15px;
  line-height: 1.6;
  color: #475569;
  padding-left: 20px;
  margin-bottom: 6px;
  position: relative;
}

.highlights li::before {
  content: "•";
  position: absolute;
  left: 0;
  color: #2563eb;
  font-weight: bold;
}

.skills-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 16px;
}

.skill-item {
  font-size: 15px;
  line-height: 1.6;
  color: #475569;
}

.skill-item strong {
  color: #1e293b;
  display: block;
  margin-bottom: 4px;
}

.skill-keywords {
  font-size: 14px;
  color: #64748b;
}

/* Print styles */
@media print {
  .resume {
    padding: 20px;
  }
  
  .section {
    page-break-inside: avoid;
  }
  
  .item {
    page-break-inside: avoid;
  }
}
`;
