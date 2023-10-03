import * as faker from 'faker';

interface Claim {
  type: string;
  claim_id: string;
  provider: string;
  description: string;
  claim_amount: string;
  claim_date: string;
}

interface Claimant {
  id: number;
  last_name: string;
  first_name: string;
  date_of_birth: string;
  eligibility_history: EligibilityRecord[];
  claims: Claim[];
}

interface EligibilityRecord {
  type: string;
  elig_start_date: string;
  start_date?: string;
  termed_date?: string;
  elig_term_date?: string;
}

function generateEligibilityHistory(dateOfBirth: string): EligibilityRecord[] {
  const currentDate = new Date();
  const birthDate = new Date(dateOfBirth);

  if (birthDate >= currentDate) {
    throw new Error("Date of birth cannot be in the future.");
  }

  // Generate numRecords with a heavy skew towards 1 or 2
  const numRecords = weightedRandom([1, 2, 3], [0.35, 0.5, 0.15]);
  const records: EligibilityRecord[] = [];

  let previousEndDate: Date | null = null;

  for (let i = 0; i < numRecords; i++) {
    const eligStartDate = previousEndDate
      ? faker.date.between(previousEndDate, currentDate, .1).toISOString().split('T')[0]
      : faker.date.between(birthDate, currentDate).toISOString().split('T')[0];

    const record: EligibilityRecord = {
      type: '',
      elig_start_date: eligStartDate,
    };

    if (Math.random() < 0.4) {
      // Generate start_date for 40% of records
      const startDate = new Date(eligStartDate);
      startDate.setDate(startDate.getDate() - 7);
      record.start_date = startDate.toISOString().split('T')[0];
    }

    const skew = weightedRandom([1,2,3,5,8,15,30], [.1,.2,.35,.2,.125,.025])
    const maxTenure = new Date(skew * 365 * 24 * 60 * 60 * 1000)
    const maxTermDate = new Date(eligStartDate).getTime() + maxTenure.getTime()

    const termDate = faker.date.between(new Date(eligStartDate), new Date(maxTermDate)).toISOString().split('T')[0] as string;
    if(Date.now() > new Date(termDate).getTime()) {
      if(!record.start_date) {
        record.elig_term_date = termDate
      } else {
        record.termed_date = termDate
      }  
    }

    if(!record.elig_term_date && record.termed_date) {
      const sevenDaysPostTerm = new Date(new Date(record.termed_date).getTime() + 7 * 24 * 60 * 60 * 1000);
      if(sevenDaysPostTerm.getTime() < Date.now()) {
        record.elig_term_date = sevenDaysPostTerm.toISOString().split('T')[0] as string
      }
    }

    let type = 'employee'
    if (!record.start_date) {
      type = 'dependent'
    }

    record.type = type

    records.push(record);

    if (record.elig_term_date) {
      previousEndDate = new Date(record.elig_term_date);
      const retireeRecord = getRetireeRecord(records, previousEndDate)
      if(retireeRecord) {
        records.push(retireeRecord)
      }
      const oneYearSpan = new Date(365 * 24 * 60 * 60 * 1000).getTime();
      if(retireeRecord || Date.now() - previousEndDate.getTime() < oneYearSpan) {
        break;
      }
    } else {
      break;
    }
  }

  return records;
}

function getRetireeRecord(records: EligibilityRecord[], lastEndDate: Date): EligibilityRecord | undefined {
  const oneDayAfterLastEndDate = new Date(lastEndDate.getTime() + 24 * 60 * 60 * 1000);
  const totalEligibilityTimespan = records.reduce((total, record) => {
    if (record.elig_start_date && record.elig_term_date) {
      total += new Date(record.elig_term_date).getTime() - new Date(record.elig_start_date).getTime();
    }
    return total;
  }, 0);
  if (totalEligibilityTimespan < new Date(5 * 365 * 24 * 60 * 60 * 1000).getTime()) {
    return undefined;
  }

  const retireeRecord: EligibilityRecord = {
    type: 'retiree',
    elig_start_date: oneDayAfterLastEndDate.toISOString().split('T')[0],
  };

  const oneThirdOfTotalEligibilityTimespan = totalEligibilityTimespan / 3;
  const retirementEligTermDate = new Date(oneDayAfterLastEndDate.getTime() + oneThirdOfTotalEligibilityTimespan);

  if (retirementEligTermDate.getTime() < Date.now()) {
    retireeRecord.elig_term_date = retirementEligTermDate.toISOString().split('T')[0]
  }

  return retireeRecord;
}

// Weighted random function
function weightedRandom(arr: number[], weights: number[]): number {
  const totalWeight = weights.reduce((acc, weight) => acc + weight, 0);
  const random = Math.random() * totalWeight;

  let sum = 0;
  for (let i = 0; i < arr.length; i++) {
    sum += weights[i];
    if (random < sum) {
      return arr[i];
    }
  }

  return arr[arr.length - 1]; // Fallback
}

function generateClaims(eligibilityHistory: EligibilityRecord[]): Claim[] {
  const claims: Claim[] = [];

  for (const eligibility of eligibilityHistory) {
    const claimCount = faker.random.number({ min: 1, max: 4 });

    for (let i = 0; i < claimCount; i++) {
      const claimStartDate = new Date(eligibility.elig_start_date);
      const claimEndDate = eligibility.elig_term_date ? new Date(eligibility.elig_term_date) : claimStartDate;

      const claimDate = faker.date.between(claimStartDate, claimEndDate);

      const claim: Claim = {
        type: 'medical',
        claim_id: faker.random.uuid(),
        provider: faker.name.firstName() + ' ' + faker.name.lastName(),
        description: 'physical therapy',
        claim_amount: '$' + faker.random.number({ min: 50, max: 200 }) + '.00',
        claim_date: claimDate.toISOString().split('T')[0],
      };

      claims.push(claim);
    }
  }

  return claims;
}

export const generateClaimant = (id: number): Claimant => {
  const date_of_birth = faker.date.past(70).toISOString().split('T')[0]
  const eligibility_history = generateEligibilityHistory(date_of_birth);
  const claimant: Claimant = {
    id,
    date_of_birth,
    last_name: faker.name.lastName(),
    first_name: faker.name.firstName(),
    claims: generateClaims(eligibility_history),
    eligibility_history,
  };

  return claimant;
}

export default generateClaimant;
