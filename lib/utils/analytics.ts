/**
 * Analytics Utility Functions
 * 
 * Provides helper functions for tracking custom events with Google Analytics 4.
 * All functions are safe to call even if GA4 is not configured.
 * 
 * @module lib/utils/analytics
 */

import { getGA4Config } from '@/lib/config/env'
import logger from './logger'

/**
 * Tracks a custom event in Google Analytics 4
 * @param eventName - Name of the event (e.g., 'download_resume', 'click_project')
 * @param eventParams - Additional parameters for the event
 */
export function trackEvent(
  eventName: string,
  eventParams?: Record<string, string | number | boolean>
): void {
  if (typeof globalThis.window === 'undefined') {
    return
  }

  const ga4Config = getGA4Config()

  if (!ga4Config?.measurementId || !globalThis.window.gtag) {
    // Silently fail if GA4 is not configured
    return
  }

  try {
    globalThis.window.gtag('event', eventName, eventParams)
  } catch (error) {
    logger.error('Failed to track event:', error)
  }
}

/**
 * Tracks a page view manually (usually handled automatically by GoogleAnalytics component)
 * @param pagePath - Path of the page being viewed
 * @param pageTitle - Title of the page
 */
export function trackPageView(pagePath: string, pageTitle?: string): void {
  if (typeof globalThis.window === 'undefined') {
    return
  }

  const ga4Config = getGA4Config()

  if (!ga4Config?.measurementId || !globalThis.window.gtag) {
    return
  }

  try {
    globalThis.window.gtag('config', ga4Config.measurementId, {
      page_path: pagePath,
      page_title: pageTitle,
    })
  } catch (error) {
    logger.error('Failed to track page view:', error)
  }
}

/**
 * Tracks a resume download event
 * @param source - Where the download was triggered from (e.g., 'hero', 'contact', 'navbar')
 */
export function trackResumeDownload(source: string): void {
  trackEvent('download_resume', {
    source,
    content_type: 'resume',
  })
}

/**
 * Tracks a project link click
 * @param projectName - Name of the project
 * @param projectUrl - URL of the project
 */
export function trackProjectClick(projectName: string, projectUrl: string): void {
  trackEvent('click_project', {
    project_name: projectName,
    project_url: projectUrl,
  })
}

/**
 * Tracks a social link click
 * @param platform - Social media platform (e.g., 'github', 'linkedin')
 * @param url - URL of the social profile
 */
export function trackSocialClick(platform: string, url: string): void {
  trackEvent('click_social', {
    platform,
    social_url: url,
  })
}

/**
 * Tracks a contact form submission
 * @param success - Whether the submission was successful
 */
export function trackContactFormSubmission(success: boolean): void {
  trackEvent('submit_contact_form', {
    success: success.toString(),
  })
}

/**
 * Tracks a section view (when user scrolls to a section)
 * @param sectionName - Name of the section (e.g., 'about', 'projects', 'experience')
 */
export function trackSectionView(sectionName: string): void {
  trackEvent('view_section', {
    section_name: sectionName,
  })
}

/**
 * Tracks a skill category expansion
 * @param category - Name of the skill category
 */
export function trackSkillCategoryToggle(category: string, expanded: boolean): void {
  trackEvent('toggle_skill_category', {
    category,
    expanded: expanded.toString(),
  })
}

