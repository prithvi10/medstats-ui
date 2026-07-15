import { useState, useCallback, useMemo } from 'react';
import type {
  DataProfile,
  ProfessorReviewDecision,
  StructuredReviewPayload,
  VariableProfile,
} from '@/lib/types';

export function normalizeVariableName(name: string): string {
  return name.toUpperCase().replace(/\s+/g, '_').trim();
}

export function findVariableProfile(
  displayName: string,
  variables: VariableProfile[]
): VariableProfile | undefined {
  const norm = normalizeVariableName(displayName);
  return variables.find(
    (v) =>
      normalizeVariableName(v.name) === norm ||
      v.name.toUpperCase() === displayName.toUpperCase().trim()
  );
}

export function useProfessorReviewState(dataProfile: DataProfile | null) {
  const [decision, setDecision] = useState<ProfessorReviewDecision | null>(null);
  const [testOverrides, setTestOverrides] = useState<Record<string, string>>({});
  const [sectionFeedback, setSectionFeedback] = useState<Record<string, string[]>>({
    methodology: [],
    executive_summary: [],
  });
  const [finalComment, setFinalComment] = useState('');

  const variables = dataProfile?.variables || [];

  const togglePreset = useCallback((target: string, code: string) => {
    setSectionFeedback((prev) => {
      const current = prev[target] || [];
      const next = current.includes(code)
        ? current.filter((c) => c !== code)
        : [...current, code];
      return { ...prev, [target]: next };
    });
  }, []);

  const handleTestChange = useCallback((variable: string, newTest: string) => {
    setTestOverrides((prev) => {
      const next = { ...prev };
      if (newTest) next[variable] = newTest;
      else delete next[variable];
      return next;
    });
  }, []);

  const flaggedSectionCount = useMemo(() => {
    let count = Object.values(sectionFeedback).filter((codes) => codes.length > 0).length;
    count += Object.values(testOverrides).filter(Boolean).length;
    return count;
  }, [sectionFeedback, testOverrides]);

  const buildPayload = useCallback((): StructuredReviewPayload | null => {
    if (!decision) return null;

    const payload: StructuredReviewPayload = {
      decision,
      test_overrides: Object.entries(testOverrides)
        .filter(([, test]) => test)
        .map(([variable, new_test]) => ({ variable, new_test })),
      section_feedback: Object.entries(sectionFeedback)
        .filter(([, codes]) => codes.length > 0)
        .map(([target, preset_codes]) => ({ target, preset_codes })),
      final_comment: finalComment.trim() || undefined,
    };

    variables.forEach((v) => {
      const codes = sectionFeedback[v.name];
      if (codes?.length) {
        const exists = payload.section_feedback.some((f) => f.target === v.name);
        if (!exists) {
          payload.section_feedback.push({ target: v.name, preset_codes: codes });
        }
      }
    });

    return payload;
  }, [decision, testOverrides, sectionFeedback, finalComment, variables]);

  const reset = useCallback(() => {
    setDecision(null);
    setTestOverrides({});
    setSectionFeedback({ methodology: [], executive_summary: [] });
    setFinalComment('');
  }, []);

  const reviewMode = decision === 'needs_revision';

  return {
    decision,
    setDecision,
    testOverrides,
    sectionFeedback,
    finalComment,
    setFinalComment,
    togglePreset,
    handleTestChange,
    flaggedSectionCount,
    buildPayload,
    reset,
    reviewMode,
    presets: dataProfile?.presets,
    variables,
  };
}

export type ProfessorReviewState = ReturnType<typeof useProfessorReviewState>;
