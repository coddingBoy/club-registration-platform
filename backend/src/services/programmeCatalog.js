const programmes = [
  {
    id: "first-touch",
    title: "First Touch",
    registrationFee: 2600,
    monthlyFee: 950,
  },
  {
    id: "little-warriors",
    title: "Little Warriors",
    registrationFee: 2700,
    monthlyFee: 1050,
  },
  {
    id: "ads",
    title: "ADS",
    registrationFee: 4850,
    monthlyFee: 1450,
  },
  {
    id: "hpds",
    title: "HPDS",
    registrationFee: 6250,
    monthlyFee: 1950,
  },
];

const getProgrammeById = (programmeId) =>
  programmes.find((programme) => programme.id === programmeId);

module.exports = {
  programmes,
  getProgrammeById,
};
