/**
 * React Component Type Definitions
 * 
 * Proper type definitions for React components and their props
 */

import type React from 'react';

/**
 * Base HTML element props
 * Used for components that extend native HTML elements
 */
export type HTMLElementProps<T extends HTMLElement = HTMLElement> = React.ComponentProps<
  React.ElementType<T>
>;

/**
 * Button element props
 */
export type ButtonElementProps = React.ComponentProps<'button'>;

/**
 * Div element props
 */
export type DivElementProps = React.ComponentProps<'div'>;

/**
 * Input element props
 */
export type InputElementProps = React.ComponentProps<'input'>;

/**
 * Main element props
 */
export type MainElementProps = React.ComponentProps<'main'>;

/**
 * Tooltip component props
 * Used for tooltip configurations
 */
export interface TooltipConfig {
  content: string;
  side?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
}

/**
 * Tooltip prop type - can be either a string or full config
 */
export type TooltipProp = string | TooltipConfig;
