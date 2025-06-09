// src/components/CompanyForm.jsx

"use client";

import { useState, useEffect } from "react";
import api from "../utils/api";
import AddContactModeModal from "./AddContactModeModal";

const CompanyForm = ({ initialData = {}, onCancel, onSubmit, type }) => {
  const data = initialData || {};
  const [formData, setFormData] = useState({
    id: data.id || "",
    num: data.num || "",
    name: data.name || "",
    cnpj: data.cnpj || "",
    ie: data.ie || "",
    email: data.email || "",
    phone: data.phone || "",
    rule: data.rule || "Simples",
    classi: data.classi || "Outros",
    uf: data.uf || "DF",
    contact: data.contact || "",
    contractInit: data.contractInit || "",
    openedByUs: data.openedByUs || false,
    important_info: data.important_info || "",
    obs: data.obs || "",
    respFiscalId: data.respFiscalId || "",
    respContabilId: data.respContabilId || "",
    respDpId: data.respDpId || "",
    contactModeId: data.contactModeId || "",
    branchNumber: data.branchNumber || "", // Campo Filial
    isHeadquarters: data.isHeadquarters || false, // Novo campo Matriz
  });

  const rules = ["Simples", "Presumido", "Real", "MEI", "Isenta", "Doméstica"];
  const classificacoes = ["ICMS", "ISS", "ICMS/ISS", "Outros"];
  const ufs = ["DF", "SP", "RJ", "MG", "RS", "BA", "PR"];

  // Estados para armazenar os usuários por departamento
  const [fiscalUsers, setFiscalUsers] = useState([]);
  const [contabilUsers, setContabilUsers] = useState([]);
  const [dpUsers, setDpUsers] = useState([]);

  // Estado para armazenar as formas de envio
  const [contactModes, setContactModes] = useState([]);

  // Estado para controlar o modal de adicionar nova forma
  const [showAddContactModeModal, setShowAddContactModeModal] = useState(false);

  useEffect(() => {
    fetchContactModes();
    if (type === "edit") {
      // Busca usuários para cada departamento apenas se for edição
      fetchUsersByDepartment("Fiscal", setFiscalUsers);
      fetchUsersByDepartment("Contábil", setContabilUsers);
      fetchUsersByDepartment("Pessoal", setDpUsers);
    }
  }, [type]);

  const fetchContactModes = async () => {
    try {
      const res = await api.get("/company/contact-modes");
      setContactModes(res.data);
    } catch (error) {
      console.error("Erro ao buscar formas de envio:", error);
    }
  };

  const fetchUsersByDepartment = async (department, setUsers) => {
    try {
      const res = await api.get(`/department/${department}`);
      setUsers(res.data);
    } catch (error) {
      console.error(
        `Erro ao buscar usuários para o departamento ${department}:`,
        error
      );
    }
  };

  const handleChange = (e) => {
    const { name, value, type: inputType, checked } = e.target;
    let newValue = inputType === "checkbox" ? checked : value;

    setFormData({
      ...formData,
      [name]: newValue,
    });
  };

  const handleAddContactMode = async (name) => {
    try {
      const res = await api.post("/company/contact-modes", { name });
      // Atualizar a lista de formas de envio
      fetchContactModes();
      // Selecionar a nova forma de envio
      setFormData((prev) => ({
        ...prev,
        contactModeId: res.data.contactMode.id,
      }));
      setShowAddContactModeModal(false);
    } catch (error) {
      console.error("Erro ao adicionar nova forma de envio:", error);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const sanitizedFormData = {
      ...formData,
      // Se o valor for vazio, salva como null
      respFiscalId: formData.respFiscalId || null,
      respContabilId: formData.respContabilId || null,
      respDpId: formData.respDpId || null,
      contactModeId: formData.contactModeId || null,
      contact: formData.contact || null,
      contractInit: formData.contractInit || null,
      // important_info e obs podem ser vazios
      important_info: formData.important_info || "",
      obs: formData.obs || "",
      branchNumber: formData.branchNumber || null,
      isHeadquarters: formData.isHeadquarters, // Salva o valor booleano
    };

    onSubmit(sanitizedFormData);
  };

  return (
    <>
      <form onSubmit={handleSubmit}>
        <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-dark-text">
          {type === "add" ? "Nova Empresa" : "Editar Empresa"}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {/* Número */}
          <div>
            <label className="block mb-1 text-gray-800 dark:text-dark-text font-semibold">
              Nº <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="num"
              className="w-full border px-3 py-2 bg-gray-100 dark:bg-dark-bg border-gray-300 dark:border-dark-border text-gray-800 dark:text-dark-text rounded"
              value={formData.num}
              onChange={handleChange}
              required
              disabled={type === "edit"}
            />
          </div>

          {/* Razão Social */}
          <div>
            <label className="block mb-1 text-gray-800 dark:text-dark-text font-semibold">
              Razão Social <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              className="w-full border px-3 py-2 bg-gray-100 dark:bg-dark-bg border-gray-300 dark:border-dark-border text-gray-800 dark:text-dark-text rounded"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          {/* CNPJ */}
          <div>
            <label className="block mb-1 text-gray-800 dark:text-dark-text font-semibold">
              CNPJ <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="cnpj"
              className="w-full border px-3 py-2 bg-gray-100 dark:bg-dark-bg border-gray-300 dark:border-dark-border text-gray-800 dark:text-dark-text rounded"
              value={formData.cnpj}
              onChange={handleChange}
              required
              maxLength={14}
              disabled={type === "edit"}
            />
          </div>

          {/* Inscrição Estadual */}
          <div>
            <label className="block mb-1 text-gray-800 dark:text-dark-text font-semibold">
              Inscrição Estadual
            </label>
            <input
              type="text"
              name="ie"
              className="w-full border px-3 py-2 bg-gray-100 dark:bg-dark-bg border-gray-300 dark:border-dark-border text-gray-800 dark:text-dark-text rounded"
              value={formData.ie}
              onChange={handleChange}
            />
          </div>

          {/* E-mail */}
          <div>
            <label className="block mb-1 text-gray-800 dark:text-dark-text font-semibold">
              E-mail <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="email"
              className="w-full border px-3 py-2 bg-gray-100 dark:bg-dark-bg border-gray-300 dark:border-dark-border text-gray-800 dark:text-dark-text rounded"
              value={formData.email}
              onChange={handleChange}
              required
            />
            <small className="text-gray-600 dark:text-gray-400">
              Caso haja mais de um e-mail, separe-os por vírgula.
            </small>
          </div>

          {/* Telefone */}
          <div>
            <label className="block mb-1 text-gray-800 dark:text-dark-text font-semibold">
              Telefone
            </label>
            <input
              type="tel"
              name="phone"
              className="w-full border px-3 py-2 bg-gray-100 dark:bg-dark-bg border-gray-300 dark:border-dark-border text-gray-800 dark:text-dark-text rounded"
              value={formData.phone}
              onChange={handleChange}
            />
          </div>

          {/* Regime */}
          <div>
            <label className="block mb-1 text-gray-800 dark:text-dark-text font-semibold">
              Regime <span className="text-red-500">*</span>
            </label>
            <select
              name="rule"
              className="w-full border px-3 py-2 bg-gray-100 dark:bg-dark-bg border-gray-300 dark:border-dark-border text-gray-800 dark:text-dark-text rounded"
              value={formData.rule}
              onChange={handleChange}
              required
            >
              {rules.map((regime) => (
                <option key={regime} value={regime}>
                  {regime}
                </option>
              ))}
            </select>
          </div>

          {/* Classificação */}
          <div>
            <label className="block mb-1 text-gray-800 dark:text-dark-text font-semibold">
              Classificação <span className="text-red-500">*</span>
            </label>
            <select
              name="classi"
              className="w-full border px-3 py-2 bg-gray-100 dark:bg-dark-bg border-gray-300 dark:border-dark-border text-gray-800 dark:text-dark-text rounded"
              value={formData.classi}
              onChange={handleChange}
              required
            >
              {classificacoes.map((classi) => (
                <option key={classi} value={classi}>
                  {classi}
                </option>
              ))}
            </select>
          </div>

          {/* UF */}
          <div>
            <label className="block mb-1 text-gray-800 dark:text-dark-text font-semibold">
              UF <span className="text-red-500">*</span>
            </label>
            <select
              name="uf"
              className="w-full border px-3 py-2 bg-gray-100 dark:bg-dark-bg border-gray-300 dark:border-dark-border text-gray-800 dark:text-dark-text rounded"
              value={formData.uf}
              onChange={handleChange}
              required
            >
              {ufs.map((uf) => (
                <option key={uf} value={uf}>
                  {uf}
                </option>
              ))}
            </select>
          </div>

          {/* Filial */}
          <div>
            <label className="block mb-1 text-gray-800 dark:text-dark-text font-semibold">
              Filial
            </label>
            <input
              type="text"
              name="branchNumber"
              className="w-full border px-3 py-2 bg-gray-100 dark:bg-dark-bg border-gray-300 dark:border-dark-border text-gray-800 dark:text-dark-text rounded"
              value={formData.branchNumber || ""}
              onChange={handleChange}
              placeholder="Número da Filial (opcional)"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {/* Contato na Empresa */}
          <div>
            <label className="block mb-1 text-gray-800 dark:text-dark-text font-semibold">
              Contato na Empresa
            </label>
            <input
              type="text"
              name="contact"
              className="w-full border px-3 py-2 bg-gray-100 dark:bg-dark-bg border-gray-300 dark:border-dark-border text-gray-800 dark:text-dark-text rounded"
              value={formData.contact || ""}
              onChange={handleChange}
              placeholder="Opcional"
            />
          </div>

          {/* Início do Contrato */}
          <div>
            <label className="block mb-1 text-gray-800 dark:text-dark-text font-semibold">
              Início do Contrato
            </label>
            <input
              type="date"
              name="contractInit"
              className="w-full border px-3 py-2 bg-gray-100 dark:bg-dark-bg border-gray-300 dark:border-dark-border text-gray-800 dark:text-dark-text rounded"
              value={formData.contractInit || ""}
              onChange={handleChange}
              placeholder="Opcional"
            />
          </div>

          {/* Forma de Envio (somente no modo edit) */}
          {type === "edit" && (
            <div>
              <label className="block mb-1 text-gray-800 dark:text-dark-text font-semibold">
                Forma de Envio
              </label>
              <select
                name="contactModeId"
                className="w-full border px-3 py-2 bg-gray-100 dark:bg-dark-bg border-gray-300 dark:border-dark-border text-gray-800 dark:text-dark-text rounded"
                value={formData.contactModeId || ""}
                onChange={handleChange}
              >
                <option value="">Opcional</option>
                {contactModes.map((mode) => (
                  <option key={mode.id} value={mode.id}>
                    {mode.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {type === "add" && (
          <div className="flex items-center mb-4">
            <input
              type="checkbox"
              name="openedByUs"
              checked={formData.openedByUs}
              onChange={handleChange}
              className="mr-2"
            />
            <label className="text-gray-800 dark:text-dark-text font-semibold">
              Empresa aberta pela Contelb?
            </label>
          </div>
        )}

        {/* Novo campo: Matriz */}
        <div className="mb-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              name="isHeadquarters"
              checked={formData.isHeadquarters}
              onChange={handleChange}
              className="mr-2"
            />
            <label className="text-gray-800 dark:text-dark-text font-semibold">
              Empresa Matriz?
            </label>
          </div>
        </div>

        {type === "add" && (
          <div className="mb-4">
            <label className="block mb-1 text-gray-800 dark:text-dark-text font-semibold">
              Informações Importantes
            </label>
            <textarea
              name="important_info"
              className="w-full border px-3 py-2 bg-gray-100 dark:bg-dark-bg border-gray-300 dark:border-dark-border text-gray-800 dark:text-dark-text rounded"
              value={formData.important_info}
              onChange={handleChange}
            ></textarea>
          </div>
        )}

        {type === "edit" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {/* Responsável Fiscal */}
            <div>
              <label className="block mb-1 text-gray-800 dark:text-dark-text font-semibold">
                Responsável Fiscal
              </label>
              <select
                name="respFiscalId"
                className="w-full border px-3 py-2 bg-gray-100 dark:bg-dark-bg border-gray-300 dark:border-dark-border text-gray-800 dark:text-dark-text rounded"
                value={formData.respFiscalId || ""}
                onChange={handleChange}
              >
                <option value="">Nenhum</option>
                {fiscalUsers.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Responsável Contábil */}
            <div>
              <label className="block mb-1 text-gray-800 dark:text-dark-text font-semibold">
                Responsável Contábil
              </label>
              <select
                name="respContabilId"
                className="w-full border px-3 py-2 bg-gray-100 dark:bg-dark-bg border-gray-300 dark:border-dark-border text-gray-800 dark:text-dark-text rounded"
                value={formData.respContabilId || ""}
                onChange={handleChange}
              >
                <option value="">Nenhum</option>
                {contabilUsers.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Responsável DP */}
            <div>
              <label className="block mb-1 text-gray-800 dark:text-dark-text font-semibold">
                Responsável DP
              </label>
              <select
                name="respDpId"
                className="w-full border px-3 py-2 bg-gray-100 dark:bg-dark-bg border-gray-300 dark:border-dark-border text-gray-800 dark:text-dark-text rounded"
                value={formData.respDpId || ""}
                onChange={handleChange}
              >
                <option value="">Nenhum</option>
                {dpUsers.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        <div className="mb-4">
          <label className="block mb-1 text-gray-800 dark:text-dark-text font-semibold">
            Observações
          </label>
          <textarea
            name="obs"
            className="w-full border px-3 py-2 bg-gray-100 dark:bg-dark-bg border-gray-300 dark:border-dark-border text-gray-800 dark:text-dark-text rounded"
            value={formData.obs}
            onChange={handleChange}
            placeholder="Opcional"
          ></textarea>
        </div>

        <div className="flex justify-end space-x-2">
          <button
            type="button"
            onClick={onCancel}
            className="bg-gray-500 text-white px-4 py-2 rounded"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="bg-accent-blue text-white px-4 py-2 rounded"
          >
            Salvar
          </button>
        </div>
      </form>

      {showAddContactModeModal && (
        <AddContactModeModal
          onClose={() => setShowAddContactModeModal(false)}
          onSave={handleAddContactMode}
        />
      )}
    </>
  );
};

export default CompanyForm;
