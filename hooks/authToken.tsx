export const autoToken = (value?: string) => {
  if (value === undefined) {
    return localStorage.getItem("auth_token") || "";
  } else {
    localStorage.setItem("auth_token", value);
  }
  return "";
};
