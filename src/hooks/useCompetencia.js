// src/hooks/useCompetencia.js
import { useContext } from "react";
import { CompetenciaContext } from "../context/CompetenciaContext";

export const useCompetencia = () => useContext(CompetenciaContext);
