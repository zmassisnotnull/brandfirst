/**
 * Server configuration for AI services
 */

// AI Provider Configuration
export const AI_CONFIG = {
  // Set to 'huggingface' for free tier, 'replicate' for paid tier
  LOGO_PROVIDER: Deno.env.get('LOGO_PROVIDER') || 'huggingface',
  
  // Hugging Face (Free)
  HUGGINGFACE_API_KEY: Deno.env.get('HUGGINGFACE_API_KEY'),
  HUGGINGFACE_MODEL: 'black-forest-labs/FLUX.1-schnell',
  
  // Replicate (Paid)
  REPLICATE_API_KEY: Deno.env.get('REPLICATE_API_KEY'),
  REPLICATE_MODEL: 'black-forest-labs/flux-1.1-pro',
  
  // OpenAI (for backgrounds)
  OPENAI_API_KEY: Deno.env.get('OPENAI_API_KEY'),
};

/**
 * Get active logo generation provider
 */
export function getLogoProvider(): 'huggingface' | 'replicate' {
  const provider = AI_CONFIG.LOGO_PROVIDER.toLowerCase();
  return provider === 'replicate' ? 'replicate' : 'huggingface';
}

/**
 * Check if provider API key is configured
 */
export function isProviderConfigured(provider: 'huggingface' | 'replicate'): boolean {
  if (provider === 'huggingface') {
    return !!AI_CONFIG.HUGGINGFACE_API_KEY;
  } else {
    return !!AI_CONFIG.REPLICATE_API_KEY;
  }
}
