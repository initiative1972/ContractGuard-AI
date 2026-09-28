import { ContractSample } from '../types';

export const SAMPLE_CONTRACTS: ContractSample[] = [
  {
    id: 'AU-CBA-2025-SYND-8821',
    title: 'Commonwealth Syndicated Commercial Facility Agreement',
    type: 'Commercial Loan Facility',
    jurisdiction: 'New South Wales, Australia (Common Law)',
    regulations: ['APRA CPG 235', 'APRA CPS 234', 'Banking Act 1959', 'ASIC Act s12BF'],
    parties: {
      bank: 'Commonwealth Bank of Australia Ltd (ABN 48 123 123 124)',
      borrower: 'Pacific Logistics Group Pty Ltd (ABN 51 824 753 556, ACN 142 901 883)',
      guarantors: ['Harbour Capital Partners Nominees (ABN 99 004 112 334)'],
    },
    summary: 'A syndicated credit facility of AUD $45,000,000 provided by an Australian banking syndicate with facility covenants, interest margin review, and cross-default triggers.',
    simulatedDefects: [
      'Clause 19.3: Outdated APRA Prudential Standard reference (cites superseded standard rather than CPS 234).',
      'Clause 24.1: Uncapped environmental indemnity with retroactive guarantor joint liability without cure period.',
      'Clause 28.4: Cross-default trigger threshold is set to a de minimis AUD $25,000, creating systemic bank default contagion.',
    ],
    originalText: `COMMERCIAL SYNDICATED LOAN FACILITY AGREEMENT
Dated: 14 January 2025
Parties:
1. COMMONWEALTH BANK OF AUSTRALIA LIMITED (ABN 48 123 123 124) ("Facility Agent" and "Security Trustee")
2. PACIFIC LOGISTICS GROUP PTY LTD (ACN 142 901 883, ABN 51 824 753 556) of Level 22, 100 Barangaroo Avenue, Sydney NSW 2000 ("Borrower")
3. HARBOUR CAPITAL PARTNERS NOMINEES PTY LTD (ABN 99 004 112 334) ("Original Guarantor")

1. DEFINITIONS AND INTERPRETATION
1.1 Definitions
"Facility Amount" means AUD $45,000,000 (Forty-Five Million Australian Dollars).
"Base Margin" means 2.45% per annum above the Bank Bill Swap Bid Rate (BBSY).
"Commitment Period" means the period from Financial Close until 31 December 2027.
"TFN Withholding" refers to Australian Tax File Number obligations under the Income Tax Assessment Act 1936; Borrower TFN: 492 881 029.

4. DRAWDOWN CONDITIONS
4.1 The Borrower may request an Advance by delivering an irrevocable Drawdown Notice signed by an authorised officer of Pacific Logistics Group Pty Ltd no later than 11:00 am (Sydney time) three Business Days prior to the proposed Utilisation Date.
4.2 Minimum drawing quantum shall be AUD $2,500,000 and integral multiples of AUD $500,000.

14. FINANCIAL COVENANTS & REPORTING
14.1 Interest Cover Ratio: The Borrower shall ensure that on each Calculation Date, the Interest Cover Ratio shall not be less than 3.50:1.00 for the rolling 12-month period.
14.2 Leverage Ratio: Total Senior Debt to Consolidated EBITDA shall not exceed 2.75:1.00 at any fiscal quarter end.
14.3 Lineage and Audit: In accordance with APRA CPG 235 principles, the Borrower must maintain permanent electronic general ledger reconciliation logs with complete audit trails accessible by the Facility Agent upon 5 Business Days notice.

19. INFORMATION SECURITY & DATA GOVERNANCE
19.1 Information Security Management: The Borrower shall implement cyber resilience controls to protect institutional customer asset records.
19.2 Incident Notification: In the event of an Information Security incident involving customer financial records, the Borrower shall notify the Agent within 48 hours of detection.
19.3 Prudential Compliance Defect: The Borrower warrants compliance with superseded APRA Prudential Standard APS 231 (Outsourcing) and APRA Guidelines 2011, neglecting current binding mandates under APRA CPS 234.

24. INDEMNITY & DEFAULT LIABILITIES
24.1 Environmental & Operational Indemnity: The Borrower and Original Guarantor Harbour Capital Partners Nominees unconditionally indemnify the Facility Agent against all losses, remediation costs, ecological restoration orders, and third-party liabilities arising from leased logistics depots. This indemnity is uncapped in amount, survives facility termination, and applies retroactively without requiring prior notice or opportunity to remedy.

28. EVENTS OF DEFAULT
28.1 Non-Payment: The Borrower fails to pay any sum due within 2 Business Days of its due date.
28.2 Financial Covenant Breach: Any breach of Clause 14.1 or 14.2 that remains unremedied for 14 Business Days.
28.3 Cross-Default Trigger: If any Financial Indebtedness of the Borrower or any Subsidiary in an aggregate amount exceeding AUD $25,000 is not paid when due or is declared prematurely repayable, an automatic Event of Default shall occur across this Facility.`,
  },
  {
    id: 'AU-NAB-2025-CLOUD-4412',
    title: 'Tier-1 Core Banking Cloud SaaS Master Services Agreement',
    type: 'SaaS Vendor Agreement (Material Outsourcing)',
    jurisdiction: 'Victoria, Australia (APRA CPS 234 Scope)',
    regulations: ['APRA CPS 234', 'APRA CPG 235', 'Privacy Act 1988 (Cth)'],
    parties: {
      bank: 'National Australia Bank Limited (ABN 12 004 044 937)',
      borrower: 'Apex Cloud Banking Solutions Pty Ltd (ABN 77 621 909 110)',
      guarantors: [],
    },
    summary: 'A mission-critical outsourcing agreement for real-time payment orchestration and cloud ledger hosting subject to APRA CPS 234 information security controls.',
    simulatedDefects: [
      'Clause 8.2: Data sovereignty defect permitting offshore failover routing of unmasked customer transaction records without prior bank consent.',
      'Clause 12.4: Audit rights restricted to once every two years with 30-day pre-notification, violating APRA regulator access mandates.',
      'Clause 15.1: Aggregate liability capped at 6 months of SaaS subscription fees (AUD $720,000), disproportionate to systemic risk.',
    ],
    originalText: `CORE BANKING CLOUD SAAS MASTER SERVICES AGREEMENT
Effective Date: 1 February 2025
Between:
NATIONAL AUSTRALIA BANK LIMITED (ABN 12 004 044 937) ("Customer Bank")
and
APEX CLOUD BANKING SOLUTIONS PTY LTD (ABN 77 621 909 110, ACN 629 110 442) ("Vendor")

3. SCOPE OF SERVICES & AVAILABILITY
3.1 The Vendor provides real-time payments routing, ISO 20022 message translation, and cloud ledger microservices under a guaranteed 99.99% monthly Service Level Agreement (SLA).
3.2 Annual Recurring Subscription Fee: AUD $1,440,000 payable quarterly in advance.

8. DATA HOSTING & SOVEREIGNTY
8.1 Primary Data Centre: The Vendor shall host production transactional databases in the AWS Sydney (ap-southeast-2) region.
8.2 Offshore Failover Exception: In the event of severe disaster recovery failover or latency mitigation, the Vendor reserves unilateral discretion to route payment messages and customer account balances through secondary compute clusters in Singapore or Frankfurt without prior written consent of Customer Bank.

12. AUDIT & APRA REGULATORY SUPERVISION
12.1 The Customer Bank or its designated independent auditor may conduct security assessments of Vendor systems.
12.2 Restricted Audit Window: Such audits may occur no more frequently than once every 24 calendar months, upon at least 30 Business Days prior written notice, during normal business hours, and strictly subject to Vendor approval of the audit scope.

15. LIMITATION OF LIABILITY
15.1 Aggregate Liability Cap: Notwithstanding any other provision, Vendor's total aggregate liability arising out of or in connection with data breaches, regulatory fines, service outages, or negligence shall be capped at the fees paid in the immediately preceding 6 months (AUD $720,000).`,
  },
  {
    id: 'AU-WBC-2025-MERCH-1190',
    title: 'Westpac National Merchant Terminal & Acquiring Terms 2025',
    type: 'Merchant Facility Agreement',
    jurisdiction: 'Queensland & Federal Australia (ASIC Act Scope)',
    regulations: ['ASIC Act 2001 s12BF (UCT)', 'APRA CPS 234', 'Payment Systems (Regulation) Act'],
    parties: {
      bank: 'Westpac Banking Corporation (ABN 33 007 457 141)',
      borrower: 'Coral Coast Retailers Association (ABN 18 902 441 552)',
      guarantors: [],
    },
    summary: 'Standard form commercial merchant acquiring terms for EFTPOS, contactless terminal processing, and settlement chargebacks.',
    simulatedDefects: [
      'Clause 6.2: Unilateral price variation clause allowing the Bank to adjust interchange margins immediately without notice or exit rights (ASIC Act s12BF UCT breach).',
      'Clause 11.1: Automatic merchant fund freeze without requirement to show probable fraud or loss.',
    ],
    originalText: `WESTPAC MERCHANT ACQUIRING & SETTLEMENT FACILITY TERMS
Version 2025.1
Parties:
WESTPAC BANKING CORPORATION (ABN 33 007 457 141, AFSL 233714) ("Bank")
CORAL COAST RETAILERS ASSOCIATION PTY LTD (ABN 18 902 441 552) ("Merchant")

4. MERCHANT DISCOUNT RATE & FEES
4.1 The Merchant agrees to pay a Merchant Discount Rate (MDR) of 1.15% on Visa and Mastercard transactions and 0.40% on EFTPOS debit.

6. VARIATION OF TERMS AND FEES
6.1 The Bank may vary terms and interchange passing rates from time to time.
6.2 Unilateral Variation Without Notice: The Bank reserves the unfettered right to increase merchant service fees, transaction surcharges, and holdback percentages at any time with immediate effect. The Merchant shall have no reciprocal right to terminate this facility without payment of an early break fee of AUD $5,000.

11. SETTLEMENT SUSPENSION & HOLDBACK
11.1 Discretionary Reserve: The Bank may, in its absolute and sole discretion, freeze any merchant settlement proceeds for up to 180 calendar days without providing prior explanation or establishing proof of fraudulent transactions.`,
  },
];
