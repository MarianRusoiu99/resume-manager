/**
 * Template Customizer Component
 * Allows users to customize template colors and fonts
 */

'use client';

import { useState } from 'react';
import type { ResumeTemplate } from '@/types/template';
import { TemplateLivePreview } from './TemplateLivePreview';

interface TemplateCustomizerProps {
  template: ResumeTemplate;
  resumeId: string;
  onSave: () => void;
  onClose: () => void;
}

export function TemplateCustomizer({
  template,
  resumeId,
  onSave,
  onClose,
}: TemplateCustomizerProps) {
  const [customizedTemplate, setCustomizedTemplate] =
    useState<ResumeTemplate>(template);
  const [isSaving, setIsSaving] = useState(false);

  // ATS-safe font options
  const fontOptions = [
    { value: 'Helvetica', label: 'Helvetica' },
    { value: 'Times-Roman', label: 'Times New Roman' },
    { value: 'Courier', label: 'Courier' },
    { value: 'Arial', label: 'Arial' },
    { value: 'Georgia', label: 'Georgia' },
  ];

  // Update color in customized template
  const updateColor = (colorKey: keyof typeof template.definition.colors, value: string) => {
    setCustomizedTemplate({
      ...customizedTemplate,
      definition: {
        ...customizedTemplate.definition,
        colors: {
          ...customizedTemplate.definition.colors,
          [colorKey]: value,
        },
      },
    });
  };

  // Update font
  const updateFont = (fontKey: 'bodyFont' | 'headingFont', value: string) => {
    setCustomizedTemplate({
      ...customizedTemplate,
      definition: {
        ...customizedTemplate.definition,
        typography: {
          ...customizedTemplate.definition.typography,
          [fontKey]: value,
        },
      },
    });
  };

  // Update font size
  const updateFontSize = (
    sizeKey: keyof typeof template.definition.typography.fontSize,
    value: number
  ) => {
    setCustomizedTemplate({
      ...customizedTemplate,
      definition: {
        ...customizedTemplate.definition,
        typography: {
          ...customizedTemplate.definition.typography,
          fontSize: {
            ...customizedTemplate.definition.typography.fontSize,
            [sizeKey]: value,
          },
        },
      },
    });
  };

  // Save customization
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/resumes/${resumeId}/template-customization`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customization: customizedTemplate.definition,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save customization');
      }

      onSave();
    } catch (error) {
      console.error('Error saving customization:', error);
      alert('Failed to save customization. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Reset to default
  const handleReset = () => {
    setCustomizedTemplate(template);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-7xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="border-b px-6 py-4 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-2xl font-bold">Customize Template</h2>
            <p className="text-sm text-gray-600">
              Adjust colors and fonts to match your style
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
            aria-label="Close customizer"
          >
            ×
          </button>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
            {/* Controls Panel */}
            <div className="space-y-6">
              {/* Color Customization */}
              <div>
                <h3 className="font-semibold text-lg mb-4">Colors</h3>
                <div className="space-y-4">
                  <ColorPicker
                    label="Primary Color"
                    description="Main text color"
                    value={customizedTemplate.definition.colors.primary}
                    onChange={(value) => updateColor('primary', value)}
                  />
                  <ColorPicker
                    label="Secondary Color"
                    description="Muted text color"
                    value={customizedTemplate.definition.colors.secondary}
                    onChange={(value) => updateColor('secondary', value)}
                  />
                  <ColorPicker
                    label="Accent Color"
                    description="Headings and highlights"
                    value={customizedTemplate.definition.colors.accent}
                    onChange={(value) => updateColor('accent', value)}
                  />
                  <ColorPicker
                    label="Border Color"
                    description="Dividers and borders"
                    value={customizedTemplate.definition.colors.border}
                    onChange={(value) => updateColor('border', value)}
                  />
                </div>
              </div>

              {/* Typography Customization */}
              <div>
                <h3 className="font-semibold text-lg mb-4">Typography</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Body Font
                    </label>
                    <select
                      value={customizedTemplate.definition.typography.bodyFont}
                      onChange={(e) => updateFont('bodyFont', e.target.value)}
                      className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {fontOptions.map((font) => (
                        <option key={font.value} value={font.value}>
                          {font.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Heading Font
                    </label>
                    <select
                      value={customizedTemplate.definition.typography.headingFont}
                      onChange={(e) => updateFont('headingFont', e.target.value)}
                      className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {fontOptions.map((font) => (
                        <option key={font.value} value={font.value}>
                          {font.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <FontSizeSlider
                    label="Name Font Size"
                    value={customizedTemplate.definition.typography.fontSize.name}
                    min={18}
                    max={32}
                    onChange={(value) => updateFontSize('name', value)}
                  />

                  <FontSizeSlider
                    label="Heading Font Size"
                    value={customizedTemplate.definition.typography.fontSize.heading}
                    min={12}
                    max={18}
                    onChange={(value) => updateFontSize('heading', value)}
                  />

                  <FontSizeSlider
                    label="Body Font Size"
                    value={customizedTemplate.definition.typography.fontSize.body}
                    min={9}
                    max={13}
                    onChange={(value) => updateFontSize('body', value)}
                  />
                </div>
              </div>

              {/* ATS Warning */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <span className="text-yellow-600 text-xl">⚠️</span>
                  <div>
                    <p className="text-sm font-medium text-yellow-900">
                      ATS Compatibility
                    </p>
                    <p className="text-xs text-yellow-700 mt-1">
                      Extreme customizations may reduce ATS parsing accuracy. Keep
                      colors readable and fonts standard for best results.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Live Preview Panel */}
            <div>
              <h3 className="font-semibold text-lg mb-4">Preview</h3>
              <div className="border rounded-lg p-4 bg-gray-50 overflow-auto max-h-[600px]">
                <TemplateLivePreview template={customizedTemplate} />
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="border-t px-6 py-4 flex justify-between shrink-0">
          <button
            onClick={handleReset}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition"
            disabled={isSaving}
          >
            Reset to Default
          </button>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border rounded-md hover:bg-gray-50 transition"
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Saving...' : 'Save Customization'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Color Picker Component
function ColorPicker({
  label,
  description,
  value,
  onChange,
}: {
  label: string;
  description: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <p className="text-xs text-gray-500 mb-2">{description}</p>
      <div className="flex items-center gap-3">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-20 rounded cursor-pointer border"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
          placeholder="#000000"
        />
      </div>
    </div>
  );
}

// Font Size Slider Component
function FontSizeSlider({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) {
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <label className="text-sm font-medium text-gray-700">{label}</label>
        <span className="text-sm text-gray-600">{value}pt</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
      />
      <div className="flex justify-between text-xs text-gray-500 mt-1">
        <span>{min}pt</span>
        <span>{max}pt</span>
      </div>
    </div>
  );
}
