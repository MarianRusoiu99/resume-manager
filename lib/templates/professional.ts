/**
 * Professional Template - Traditional ATS-optimized design
 * Maximum readability and ATS parsing compatibility
 */

export const professionalTemplateHtml = `
<div class="resume">
  <header class="header">
    {{#if basics.name}}
      <h1 class="name">{{basics.name}}</h1>
    {{/if}}
    
    {{#if basics.label}}
      <div class="label">{{basics.label}}</div>
    {{/if}}
    
    <div class="contact">
      {{#if basics.email}}
        <span>{{basics.email}}</span>
      {{/if}}
      {{#if basics.phone}}
        <span>{{basics.phone}}</span>
      {{/if}}
      {{#if basics.location}}
        <span>{{formatLocation basics.location}}</span>
      {{/if}}
      {{#if basics.url}}
        <span>{{basics.url}}</span>
      {{/if}}
    </div>
  </header>

  {{#if basics.summary}}
    <section class="section">
      <h2 class="section-title">PROFESSIONAL SUMMARY</h2>
      <p class="summary">{{basics.summary}}</p>
    </section>
  {{/if}}

  {{#if (hasItems skills)}}
    <section class="section">
      <h2 class="section-title">SKILLS</h2>
      <div class="skills-list">
        {{#each skills}}
          <div class="skill-group">
            {{#if name}}<strong>{{name}}:</strong>{{/if}}
            {{#if (hasItems keywords)}}
              <span>{{join keywords ", "}}</span>
            {{else}}
              {{#if level}}<span>{{level}}</span>{{/if}}
            {{/if}}
          </div>
        {{/each}}
      </div>
    </section>
  {{/if}}

  {{#if (hasItems work)}}
    <section class="section">
      <h2 class="section-title">PROFESSIONAL EXPERIENCE</h2>
      {{#each work}}
        <div class="experience-item">
          <div class="item-header">
            {{#if position}}<h3 class="position">{{position}}</h3>{{/if}}
            {{#if name}}<div class="company">{{name}}</div>{{/if}}
            <div class="dates">{{dateRange startDate endDate}}</div>
          </div>
          {{#if summary}}
            <p class="description">{{summary}}</p>
          {{/if}}
          {{#if (hasItems highlights)}}
            <ul class="achievements">
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
      <h2 class="section-title">EDUCATION</h2>
      {{#each education}}
        <div class="education-item">
          <div class="item-header">
            <div>
              {{#if studyType}}{{#if area}}
                <h3 class="degree">{{studyType}} in {{area}}</h3>
              {{else}}
                <h3 class="degree">{{studyType}}</h3>
              {{/if}}{{else}}{{#if area}}
                <h3 class="degree">{{area}}</h3>
              {{/if}}{{/if}}
              {{#if institution}}<div class="school">{{institution}}</div>{{/if}}
            </div>
            <div class="dates">{{dateRange startDate endDate}}</div>
          </div>
          {{#if score}}
            <div class="gpa">GPA: {{score}}</div>
          {{/if}}
        </div>
      {{/each}}
    </section>
  {{/if}}

  {{#if (hasItems certificates)}}
    <section class="section">
      <h2 class="section-title">CERTIFICATIONS</h2>
      {{#each certificates}}
        <div class="cert-item">
          {{#if name}}<strong>{{name}}</strong>{{/if}}
          {{#if issuer}} - {{issuer}}{{/if}}
          {{#if date}} ({{formatDate date}}){{/if}}
        </div>
      {{/each}}
    </section>
  {{/if}}

  {{#if (hasItems projects)}}
    <section class="section">
      <h2 class="section-title">PROJECTS</h2>
      {{#each projects}}
        <div class="project-item">
          <div class="item-header">
            {{#if name}}<h3 class="project-name">{{name}}</h3>{{/if}}
            {{#if startDate}}
              <div class="dates">{{dateRange startDate endDate}}</div>
            {{/if}}
          </div>
          {{#if description}}
            <p class="description">{{description}}</p>
          {{/if}}
          {{#if (hasItems highlights)}}
            <ul class="achievements">
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

export const professionalTemplateCss = `
.resume {
  max-width: 800px;
  margin: 0 auto;
  padding: 40px;
  font-family: 'Times New Roman', Times, serif;
  font-size: 11pt;
  line-height: 1.5;
  color: #000000;
  background: #ffffff;
}

/* Header */
.header {
  text-align: center;
  border-bottom: 2px solid #000000;
  padding-bottom: 12px;
  margin-bottom: 20px;
}

.name {
  font-size: 24pt;
  font-weight: bold;
  margin: 0 0 6px 0;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.label {
  font-size: 12pt;
  margin-bottom: 8px;
}

.contact {
  font-size: 10pt;
  line-height: 1.4;
}

.contact span {
  margin: 0 8px;
}

.contact span:first-child {
  margin-left: 0;
}

/* Sections */
.section {
  margin-bottom: 20px;
}

.section-title {
  font-size: 12pt;
  font-weight: bold;
  text-transform: uppercase;
  border-bottom: 1px solid #000000;
  padding-bottom: 4px;
  margin-bottom: 12px;
  letter-spacing: 0.5px;
}

.summary {
  margin: 0;
  text-align: justify;
}

/* Skills */
.skills-list {
  display: block;
}

.skill-group {
  margin-bottom: 6px;
  line-height: 1.6;
}

.skill-group strong {
  font-weight: bold;
}

/* Experience */
.experience-item {
  margin-bottom: 16px;
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 4px;
}

.position {
  font-size: 12pt;
  font-weight: bold;
  margin: 0 0 2px 0;
}

.company {
  font-size: 11pt;
  font-style: italic;
  margin-bottom: 2px;
}

.dates {
  font-size: 10pt;
  white-space: nowrap;
  margin-left: 12px;
}

.description {
  margin: 4px 0 6px 0;
}

.achievements {
  margin: 6px 0 0 20px;
  padding: 0;
}

.achievements li {
  margin-bottom: 3px;
  text-align: justify;
}

/* Education */
.education-item {
  margin-bottom: 12px;
}

.degree {
  font-size: 11pt;
  font-weight: bold;
  margin: 0 0 2px 0;
}

.school {
  font-size: 11pt;
  margin-bottom: 2px;
}

.gpa {
  font-size: 10pt;
  margin-top: 2px;
}

/* Certifications */
.cert-item {
  margin-bottom: 6px;
  line-height: 1.4;
}

/* Projects */
.project-item {
  margin-bottom: 14px;
}

.project-name {
  font-size: 11pt;
  font-weight: bold;
  margin: 0 0 2px 0;
}

/* Print styles for multi-page support */
@media print {
  .resume {
    padding: 20px;
  }
  
  .section {
    page-break-inside: avoid;
  }
  
  .experience-item,
  .education-item,
  .project-item {
    page-break-inside: avoid;
  }
  
  .item-header {
    page-break-after: avoid;
  }
  
  h2 {
    page-break-after: avoid;
  }
}
`;
