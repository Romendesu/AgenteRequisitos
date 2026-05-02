import { useState } from "react";
import * as api from "../services/api";

export const PHASE = {
  SETUP: "setup",
  COLLECTING: "collecting",
  STAKEHOLDERS: "stakeholders",
  WAITING: "waiting",
  GENERATING: "generating",
  DONE: "done",
};

function msg(role, type, payload = {}) {
  return { id: crypto.randomUUID(), role, type, ...payload };
}

export default function useChat() {
  const [messages, setMessages] = useState([]);
  const [phase, setPhase] = useState(PHASE.SETUP);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState("");
  const [proyecto, setProyecto] = useState(null);
  const [projectId, setProjectId] = useState(null);

  const push = (m) => setMessages((prev) => [...prev, m]);

  async function iniciarProyecto(nombre, descripcion) {
    setLoading(true);
    try {
      const project = await api.crearProyecto(nombre, descripcion);
      setProyecto({ nombre: project.nombre, descripcion: project.descripcion });
      setProjectId(project.id);
      push(
        msg("ai", "text", {
          text: `¡Perfecto! He registrado el proyecto "${project.nombre}"${project.descripcion ? ` — ${project.descripcion}` : ""}. Ahora cuéntame cuál es el primer requisito que necesita el sistema.`,
        })
      );
      setPhase(PHASE.COLLECTING);
    } catch (e) {
      push(msg("ai", "text", { text: `Error al crear el proyecto: ${e.message}` }));
    } finally {
      setLoading(false);
    }
  }

  async function cargarProyecto(project) {
    const proy = { nombre: project.nombre, descripcion: project.descripcion };
    setProyecto(proy);
    setProjectId(project.id);
    setLoading(true);

    try {
      const [reqData, priorizacion] = await Promise.allSettled([
        api.listarRequisitos(project.id),
        api.obtenerPriorizacion(project.id),
      ]);

      const requisitos = reqData.status === "fulfilled" ? reqData.value.requisitos ?? [] : [];
      const prio = priorizacion.status === "fulfilled" ? priorizacion.value : null;

      const msgs = [
        msg("ai", "text", {
          text: `Proyecto "${project.nombre}" cargado.${project.descripcion ? ` — ${project.descripcion}` : ""} Aquí tienes el historial de requisitos:`,
        }),
      ];

      for (const req of requisitos) {
        msgs.push(msg("ai", "requirement", { requisito: req, calidad: null }));
      }

      if (prio) {
        msgs.push(
          msg("ai", "document", {
            priorizacion: prio,
            doc: { descargar: { md: true, pdf: true, docx: true } },
            proyecto: proy,
            projectId: project.id,
          })
        );
      }

      if (!prio && requisitos.length > 0) {
        msgs.push(
          msg("ai", "text", { text: "Puedes añadir más requisitos o generar el documento." })
        );
      }

      setMessages(msgs);
      setPhase(PHASE.COLLECTING);
    } catch {
      setMessages([msg("ai", "text", { text: `Error al cargar el proyecto.` })]);
      setPhase(PHASE.WAITING);
    } finally {
      setLoading(false);
    }
  }

  async function submit(texto) {
    if (phase === PHASE.STAKEHOLDERS) {
      await _generarConInteresados(texto);
      return;
    }
    push(msg("user", "text", { text: texto }));
    setLoading(true);
    setLoadingStep("Agente Extractor — clasificando y redactando el requisito");

    const timer = setTimeout(
      () => setLoadingStep("Agente Validador — evaluando claridad y criterios de calidad"),
      3000
    );

    const textoConContexto = proyecto
      ? `Contexto del proyecto: "${proyecto.nombre}" — ${proyecto.descripcion}.\n\n${texto}`
      : texto;

    try {
      const data = await api.crearRequisito(projectId, textoConContexto);
      push(msg("ai", "requirement", { requisito: data.requisito, calidad: data.calidad }));
      setPhase(PHASE.COLLECTING);
    } catch (e) {
      const isDuplicate = e.message?.toLowerCase().includes("similar") || e.message?.toLowerCase().includes("existe");
      push(msg("ai", "text", {
        text: isDuplicate
          ? `⚠️ ${e.message}. Por favor, describe un requisito diferente.`
          : `No pude procesar el requisito: ${e.message}`,
        isWarning: isDuplicate,
      }));
      setPhase(PHASE.COLLECTING);
    } finally {
      clearTimeout(timer);
      setLoading(false);
      setLoadingStep("");
    }
  }

  function continuar() {
    push(msg("ai", "text", { text: "De acuerdo, ¿qué más necesita el sistema?" }));
    setPhase(PHASE.COLLECTING);
  }

  function finalizar() {
    push(msg("ai", "text", {
      text: "Antes de generar el documento, cuéntame quiénes son los interesados del proyecto. Puedes listarlos con su nombre, rol y responsabilidad (uno por línea, ej: \"Ana García — Product Manager — Define el backlog y prioridades\").",
    }));
    setPhase(PHASE.STAKEHOLDERS);
  }

  async function _generarConInteresados(stakeholderText) {
    push(msg("user", "text", { text: stakeholderText }));
    setPhase(PHASE.GENERATING);
    setLoading(true);

    try {
      setLoadingStep("Agente Priorizador — calculando scores MoSCoW");
      const priorizacion = await api.priorizar(projectId);

      setLoadingStep("Agente Writer — generando documento con IA");
      const writerTimer = setTimeout(
        () => setLoadingStep("Agente Writer — renderizando Markdown, PDF y DOCX"),
        4000
      );

      const doc = await api.generarDocumento(projectId, stakeholderText);
      clearTimeout(writerTimer);

      push(msg("ai", "document", { priorizacion, doc, proyecto, projectId }));
      setPhase(PHASE.COLLECTING);
    } catch (e) {
      push(msg("ai", "text", { text: `Error al generar el documento: ${e.message}` }));
      setPhase(PHASE.COLLECTING);
    } finally {
      setLoading(false);
      setLoadingStep("");
    }
  }

  function reset() {
    setMessages([]);
    setPhase(PHASE.SETUP);
    setProyecto(null);
    setProjectId(null);
  }

  const requisitos = messages
    .filter((m) => m.type === "requirement")
    .map((m) => m.requisito);

  const docMsg = [...messages].reverse().find((m) => m.type === "document");
  const moscowLabels = docMsg?.priorizacion?.moscow_labels ?? {};
  const docInfo = docMsg
    ? { priorizacion: docMsg.priorizacion, doc: docMsg.doc, projectId: docMsg.projectId, proyecto: docMsg.proyecto }
    : null;

  return {
    messages,
    phase,
    loading,
    loadingStep,
    proyecto,
    projectId,
    requisitos,
    moscowLabels,
    docInfo,
    submit,
    continuar,
    finalizar,
    iniciarProyecto,
    cargarProyecto,
    reset,
  };
}
