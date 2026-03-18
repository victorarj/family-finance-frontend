import axios from "axios";

type ApiErrorOptions = {
  fallback: string;
};

function normalizeBackendMessage(error: unknown) {
  if (
    error &&
    typeof error === "object" &&
    "response" in error &&
    error.response &&
    typeof error.response === "object" &&
    "data" in error.response &&
    error.response.data &&
    typeof error.response.data === "object"
  ) {
    if ("error" in error.response.data && typeof error.response.data.error === "string") {
      return error.response.data.error;
    }
    if ("detail" in error.response.data && typeof error.response.data.detail === "string") {
      return error.response.data.detail;
    }
    if ("message" in error.response.data && typeof error.response.data.message === "string") {
      return error.response.data.message;
    }
  }

  return null;
}

export function getApiErrorMessage(error: unknown, fallbackOrOptions: string | ApiErrorOptions) {
  const fallback =
    typeof fallbackOrOptions === "string" ? fallbackOrOptions : fallbackOrOptions.fallback;

  if (!axios.isAxiosError(error)) {
    return fallback;
  }

  if (error.code === "ERR_CANCELED") {
    return fallback;
  }

  if (!error.response) {
    return "Não foi possível concluir a ação. Verifique sua conexão e tente novamente.";
  }

  const status = error.response.status;
  const backendMessage = normalizeBackendMessage(error)?.toLowerCase() || "";

  if (status === 400 && backendMessage.includes("invalid email or password")) {
    return "Email ou senha inválidos.";
  }
  if (status === 400 && backendMessage.includes("preferences must be saved before completing onboarding")) {
    return "Salve suas preferências antes de concluir o onboarding.";
  }
  if (status === 400 && backendMessage.includes("inactive bank account")) {
    return "Selecione uma conta bancária ativa para continuar.";
  }
  if (status === 400 && backendMessage.includes("currency not supported")) {
    return "Selecione uma moeda válida cadastrada no sistema.";
  }
  if (status === 403 && backendMessage.includes("forbidden")) {
    return "Você não tem permissão para executar esta ação.";
  }
  if (status === 404) {
    return "O item solicitado não foi encontrado.";
  }
  if (status === 409 && backendMessage.includes("snapshot already exists")) {
    return "Já existe um snapshot para este mês.";
  }
  if (status === 409 && backendMessage.includes("projected balance is negative or zero")) {
    return "Seu saldo projetado está zerado ou negativo. Confirme apenas se realmente quiser concluir o planejamento.";
  }
  if (status === 409 && backendMessage.includes("currency already exists")) {
    return "Esta moeda já existe.";
  }
  if (status === 409 && backendMessage.includes("bank account name already exists")) {
    return "Já existe uma conta bancária com esse nome.";
  }
  if (status === 409 && backendMessage.includes("historically used bank accounts")) {
    return "Contas com histórico devem ser desativadas em vez de excluídas.";
  }
  if (status === 401) {
    return fallback;
  }

  return fallback;
}
