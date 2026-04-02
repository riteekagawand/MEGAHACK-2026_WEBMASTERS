const doctors = [
  { id: 1, graduationYear: 2010, yearsOfExperience: 14 },
  { id: 2, graduationYear: 2012, yearsOfExperience: 12 },
  { id: 3, graduationYear: 2015, yearsOfExperience: 9 },
  { id: 4, graduationYear: 2008, yearsOfExperience: 16 },
  { id: 5, graduationYear: 2011, yearsOfExperience: 13 },
  { id: 6, graduationYear: 2013, yearsOfExperience: 11 },
  { id: 7, graduationYear: 2009, yearsOfExperience: 15 },
  { id: 8, graduationYear: 2014, yearsOfExperience: 10 },
  { id: 9, graduationYear: 2016, yearsOfExperience: 8 },
  { id: 10, graduationYear: 2010, yearsOfExperience: 14 },
  { id: 11, graduationYear: 2007, yearsOfExperience: 17 },
  { id: 12, graduationYear: 2017, yearsOfExperience: 7 },
  { id: 13, graduationYear: 2013, yearsOfExperience: 11 },
  { id: 14, graduationYear: 2014, yearsOfExperience: 10 },
  { id: 15, graduationYear: 2011, yearsOfExperience: 13 },
];

// Calculate statistics for Graduation Year
const graduationYears = doctors.map(d => d.graduationYear).sort((a, b) => a - b);
console.log("\n=== GRADUATION YEAR STATISTICS ===");
console.log("Data:", graduationYears);

// Mean
const meanYear = graduationYears.reduce((a, b) => a + b, 0) / graduationYears.length;
console.log(`Mean: ${meanYear.toFixed(2)}`);

// Median
const mid = Math.floor(graduationYears.length / 2);
const medianYear = graduationYears.length % 2 === 0 
  ? (graduationYears[mid - 1] + graduationYears[mid]) / 2 
  : graduationYears[mid];
console.log(`Median: ${medianYear}`);

// Mode
const yearFrequency = {};
graduationYears.forEach(year => {
  yearFrequency[year] = (yearFrequency[year] || 0) + 1;
});
const maxFreq = Math.max(...Object.values(yearFrequency));
const modeYears = Object.keys(yearFrequency).filter(year => yearFrequency[year] === maxFreq);
console.log(`Mode: ${modeYears.join(', ')} (appears ${maxFreq} times each)`);

// Range
console.log(`Range: ${graduationYears[0]} - ${graduationYears[graduationYears.length - 1]}`);

// Calculate statistics for Years of Experience
const experience = doctors.map(d => d.yearsOfExperience).sort((a, b) => a - b);
console.log("\n=== YEARS OF EXPERIENCE STATISTICS ===");
console.log("Data:", experience);

// Mean
const meanExp = experience.reduce((a, b) => a + b, 0) / experience.length;
console.log(`Mean: ${meanExp.toFixed(2)} years`);

// Median
const medianExp = experience.length % 2 === 0 
  ? (experience[mid - 1] + experience[mid]) / 2 
  : experience[mid];
console.log(`Median: ${medianExp} years`);

// Mode
const expFrequency = {};
experience.forEach(exp => {
  expFrequency[exp] = (expFrequency[exp] || 0) + 1;
});
const maxExpFreq = Math.max(...Object.values(expFrequency));
const modeExps = Object.keys(expFrequency).filter(exp => expFrequency[exp] === maxExpFreq);
console.log(`Mode: ${modeExps.join(', ')} years (appears ${maxExpFreq} times each)`);

// Range
console.log(`Range: ${experience[0]} - ${experience[experience.length - 1]} years`);

// Standard Deviation for Experience
const variance = experience.reduce((sum, exp) => sum + Math.pow(exp - meanExp, 2), 0) / experience.length;
const stdDev = Math.sqrt(variance);
console.log(`Standard Deviation: ${stdDev.toFixed(2)} years`);

// Distribution by Council
console.log("\n=== COUNCIL DISTRIBUTION ===");
const councils = doctors.map(d => d.councilName);
const councilCount = {};
councils.forEach(council => {
  councilCount[council] = (councilCount[council] || 0) + 1;
});
Object.entries(councilCount).forEach(([council, count]) => {
  console.log(`${council}: ${count} doctor(s)`);
});

// Distribution by Specialization
console.log("\n=== SPECIALIZATION DISTRIBUTION ===");
const specializations = doctors.map(d => d.specialization);
const specCount = {};
specializations.forEach(spec => {
  specCount[spec] = (specCount[spec] || 0) + 1;
});
Object.entries(specCount).forEach(([spec, count]) => {
  console.log(`${spec}: ${count} doctor(s)`);
});

// Experience Level Categories
console.log("\n=== EXPERIENCE LEVEL BREAKDOWN ===");
const juniorCount = doctors.filter(d => d.yearsOfExperience < 10).length;
const midLevelCount = doctors.filter(d => d.yearsOfExperience >= 10 && d.yearsOfExperience < 15).length;
const seniorCount = doctors.filter(d => d.yearsOfExperience >= 15).length;
console.log(`Junior (< 10 years): ${juniorCount} doctors (${(juniorCount/15*100).toFixed(1)}%)`);
console.log(`Mid-level (10-14 years): ${midLevelCount} doctors (${(midLevelCount/15*100).toFixed(1)}%)`);
console.log(`Senior (15+ years): ${seniorCount} doctors (${(seniorCount/15*100).toFixed(1)}%)`);
