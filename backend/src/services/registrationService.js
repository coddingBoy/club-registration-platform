const { Parser } = require("json2csv");
const Registration = require("../models/Registration");

const buildRegistrationQuery = ({ search, status, ageGroup }) => {
  const query = {};

  if (status && status !== "all") {
    query.status = status;
  }

  if (ageGroup && ageGroup !== "all") {
    query.ageGroup = ageGroup;
  }

  if (search) {
    const regex = new RegExp(search, "i");
    query.$or = [
      { playerName: regex },
      { parentName: regex },
      { email: regex },
      { phone: regex },
    ];
  }

  return query;
};

const listRegistrations = async (filters) => {
  const query = buildRegistrationQuery(filters);
  return Registration.find(query).sort({ createdAt: -1 });
};

const createRegistration = async (payload) => Registration.create(payload);

const updateRegistrationStatus = async (id, status) =>
  Registration.findByIdAndUpdate(id, { status }, { new: true, runValidators: true });

const exportRegistrationsCsv = async (filters) => {
  const registrations = await listRegistrations(filters);
  const parser = new Parser({
    fields: [
      { label: "Player Name", value: "playerName" },
      {
        label: "Date of Birth",
        value: ({ dateOfBirth }) => new Date(dateOfBirth).toISOString().slice(0, 10),
      },
      { label: "Age Group", value: "ageGroup" },
      { label: "Parent Name", value: "parentName" },
      { label: "Email", value: "email" },
      { label: "Phone", value: "phone" },
      { label: "Status", value: "status" },
      { label: "Payment Reference", value: "paymentReference" },
      {
        label: "Submitted At",
        value: ({ createdAt }) => new Date(createdAt).toISOString(),
      },
    ],
  });

  return parser.parse(registrations);
};

module.exports = {
  listRegistrations,
  createRegistration,
  updateRegistrationStatus,
  exportRegistrationsCsv,
};
