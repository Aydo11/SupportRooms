export const VERIFICATION_CHECKLIST_VERSION = "2026-09";

export const REQUIRED_VERIFICATION_DOCUMENTS = [
  {
    input: "incorporationDocument",
    category: "INCORPORATION",
    label: "Certificate of incorporation or charity registration",
    hint: "The registered name and number must match your RoomsNow company profile.",
  },
  {
    input: "insuranceDocument",
    category: "INSURANCE",
    label: "Current company insurance",
    hint: "Public liability and, where relevant, professional indemnity or employers’ liability cover.",
  },
  {
    input: "organisationChart",
    category: "ORGANISATION_CHART",
    label: "Organisation chart",
    hint: "Show directors, accountable leaders, safeguarding responsibility and service management lines.",
  },
  {
    input: "safeguardingPolicy",
    category: "SAFEGUARDING_POLICY",
    label: "Safeguarding policy",
    hint: "A current policy naming the responsible lead and reporting route.",
  },
] as const;

export const OPTIONAL_VERIFICATION_DOCUMENTS = [
  {
    input: "regulatorEvidence",
    category: "REGULATOR_EVIDENCE",
    label: "Regulator or commissioning evidence",
    hint: "For example CQC, Ofsted, RQIA, Care Inspectorate, local authority or framework evidence, where applicable.",
  },
  {
    input: "dataProtectionEvidence",
    category: "DATA_PROTECTION",
    label: "Data protection evidence",
    hint: "For example an ICO registration certificate or equivalent evidence where required.",
  },
] as const;

export const VERIFICATION_CATEGORY_LABELS: Record<string, string> = {
  INCORPORATION: "Incorporation or registration",
  INSURANCE: "Company insurance",
  ORGANISATION_CHART: "Organisation chart",
  SAFEGUARDING_POLICY: "Safeguarding policy",
  REGULATOR_EVIDENCE: "Regulator or commissioning evidence",
  DATA_PROTECTION: "Data protection evidence",
  ADDITIONAL: "Additional evidence",
};

export type VerificationChecks = {
  register: boolean;
  insurance: boolean;
  governance: boolean;
  safeguarding: boolean;
  identity: boolean;
};
