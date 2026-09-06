import { UserProfile, EligibilityRule, SchemeMatchResult } from '@/types';

/**
 * Offline eligibility engine - runs entirely in the browser.
 * Evaluates all schemes against a citizen's profile.
 */

function evaluateRule(profile: Record<string, any>, rule: EligibilityRule): boolean {
  const actual = profile[rule.field];
  if (actual === undefined || actual === null) return false;

  const { operator, value } = rule;

  try {
    switch (operator) {
      case 'eq': return actual === value;
      case 'neq': return actual !== value;
      case 'lt': return Number(actual) < Number(value);
      case 'lte': return Number(actual) <= Number(value);
      case 'gt': return Number(actual) > Number(value);
      case 'gte': return Number(actual) >= Number(value);
      case 'in': return Array.isArray(value) ? value.includes(actual) : actual === value;
      case 'not_in': return Array.isArray(value) ? !value.includes(actual) : actual !== value;
      default: return false;
    }
  } catch {
    return false;
  }
}

function checkNearMiss(profile: Record<string, any>, rule: EligibilityRule): boolean {
  if (!rule.near_miss_threshold) return false;
  const actual = Number(profile[rule.field]);
  const target = Number(rule.value);
  if (isNaN(actual) || isNaN(target) || target === 0) return false;
  const pctDiff = Math.abs(actual - target) / target * 100;
  return pctDiff <= rule.near_miss_threshold;
}

export interface MatchResult {
  eligible: SchemeMatchResult[];
  nearMiss: SchemeMatchResult[];
  totalAnnualBenefit: number;
}

export function matchSchemes(profile: UserProfile, schemes: any[]): MatchResult {
  const profileDict = profile as Record<string, any>;
  const eligible: SchemeMatchResult[] = [];
  const nearMiss: SchemeMatchResult[] = [];

  // 4-tier scope filtering
  const citizenState = profileDict.state;
  const citizenDistrict = profileDict.district;
  const citizenTaluka = profileDict.taluka;

  for (const scheme of schemes) {
    // Scope check
    if (scheme.scope === 'state' && scheme.scope_state !== citizenState) continue;
    if (scheme.scope === 'district' && (scheme.scope_state !== citizenState || scheme.scope_district !== citizenDistrict)) continue;
    if (scheme.scope === 'taluka' && (scheme.scope_state !== citizenState || scheme.scope_district !== citizenDistrict || scheme.scope_taluka !== citizenTaluka)) continue;

    const rules: EligibilityRule[] = scheme.eligibility_rules || [];

    if (rules.length === 0) {
      eligible.push(schemeToResult(scheme));
      continue;
    }

    const failedRules = rules.filter(r => !evaluateRule(profileDict, r));

    if (failedRules.length === 0) {
      eligible.push(schemeToResult(scheme));
    } else if (failedRules.length === 1) {
      const rule = failedRules[0];
      if (checkNearMiss(profileDict, rule)) {
        const result = schemeToResult(scheme);
        result.near_miss_rule = {
          field: rule.field,
          label: rule.label,
          tip: rule.near_miss_tip || '',
        };
        nearMiss.push(result);
      }
    }
  }

  eligible.sort((a, b) => b.benefit_amount - a.benefit_amount);
  nearMiss.sort((a, b) => b.benefit_amount - a.benefit_amount);

  const totalAnnualBenefit = eligible.reduce((sum, s) => {
    if (s.benefit_frequency === 'monthly') return sum + s.benefit_amount * 12;
    if (s.benefit_frequency === 'annual') return sum + s.benefit_amount;
    return sum + s.benefit_amount;
  }, 0);

  return { eligible, nearMiss, totalAnnualBenefit };
}

function schemeToResult(scheme: any): SchemeMatchResult {
  return {
    scheme_id: scheme.scheme_id,
    name: scheme.name || { en: '', hi: '' },
    description: scheme.description || { en: '', hi: '' },
    ministry: scheme.ministry || '',
    department: scheme.department || '',
    category: scheme.category || [],
    benefit_type: scheme.benefit_type || 'cash',
    benefit_amount: scheme.benefit_amount || 0,
    benefit_frequency: scheme.benefit_frequency || 'annual',
    deadline: scheme.deadline,
    scope: scheme.scope || 'national',
    required_documents: scheme.required_documents || [],
  };
}
