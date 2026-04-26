import { validateTreeForm } from "../validateTreeForm";
import { EMPTY_OBSERVATION_FORM } from "../../observations/observations.types";

function validForm() {
  return {
    ...EMPTY_OBSERVATION_FORM,
    title: "Oak on the hill",
    details: {
      ...EMPTY_OBSERVATION_FORM.details,
      heightM: "12",
      trunkDiameterCm: "45",
      canopyDiameterM: "8",
    },
  };
}

describe("validateTreeForm", () => {
  // Happy path

  test("returns null when all required fields are present", () => {
    expect(validateTreeForm(validForm())).toBeNull();
  });

  // Title validation

  test("returns error when title is empty", () => {
    const form = { ...validForm(), title: "" };
    expect(validateTreeForm(form)).toBe("Title is required — go to the Note tab.");
  });

  test("returns error when title is whitespace only", () => {
    const form = { ...validForm(), title: "   " };
    expect(validateTreeForm(form)).toBe("Title is required — go to the Note tab.");
  });

  // Height validation

  test("returns error when heightM is empty", () => {
    const form = validForm();
    form.details = { ...form.details, heightM: "" };
    expect(validateTreeForm(form)).toBe("Height (m) is required — go to the Details tab.");
  });

  // Trunk diameter validation

  test("returns error when trunkDiameterCm is empty", () => {
    const form = validForm();
    form.details = { ...form.details, trunkDiameterCm: "" };
    expect(validateTreeForm(form)).toBe("Trunk diameter (cm) is required — go to the Details tab.");
  });

  // Canopy diameter validation

  test("returns error when canopyDiameterM is empty", () => {
    const form = validForm();
    form.details = { ...form.details, canopyDiameterM: "" };
    expect(validateTreeForm(form)).toBe("Canopy diameter (m) is required — go to the Details tab.");
  });

  // Field priority — title checked first

  test("reports title error before height error when both are missing", () => {
    const form = { ...validForm(), title: "" };
    form.details = { ...form.details, heightM: "" };
    expect(validateTreeForm(form)).toBe("Title is required — go to the Note tab.");
  });

  // All fields empty

  test("returns title error when form is completely empty", () => {
    expect(validateTreeForm(EMPTY_OBSERVATION_FORM)).toBe(
      "Title is required — go to the Note tab."
    );
  });
});
