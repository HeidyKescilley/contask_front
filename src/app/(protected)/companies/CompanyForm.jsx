// src/app/(protected)/companies/CompanyForm.jsx

import { useState, useEffect } from "react";
import api from "../../../utils/api";

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
  });

  const rules = ["Simples", "Presumido", "Real", "MEI", "Isenta", "Doméstica"];
  const classificacoes = ["ICMS", "ISS", "ICMS/ISS", "Outros"];
  const ufs = ["DF", "SP", "RJ", "MG", "RS", "BA", "PR"];

  // Estados para armazenar os usuários por departamento
  const [fiscalUsers, setFiscalUsers] = useState([]);
  const [contabilUsers, setContabilUsers] = useState([]);
  const [dpUsers, setDpUsers] = useState([]);

  useEffect(() => {
    if (type === "edit") {
      // Busca usuários para cada departamento
      fetchUsersByDepartment("Fiscal", setFiscalUsers);
      fetchUsersByDepartment("Contábil", setContabilUsers);
      fetchUsersByDepartment("Pessoal", setDpUsers);
    }
  }, [type]);

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
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-dark-text">
        {type === "add" ? "Nova Empresa" : "Editar Empresa"}
      </h2>
      <div className="grid grid-cols-3 gap-4 mb-4">
        {/* Número */}
        <div>
          <label className="block mb-1 text-gray-800 dark:text-dark-text">
            Nº
          </label>
          <input
            type="text"
            name="num"
            className="w-full border px-3 py-2 bg-gray-100 dark:bg-dark-bg border-gray-300 dark:border-dark-border text-gray-800 dark:text-dark-text"
            value={formData.num}
            onChange={handleChange}
            required
            disabled={type === "edit"}
          />
        </div>
        {/* Razão Social */}
        <div>
          <label className="block mb-1 text-gray-800 dark:text-dark-text">
            Razão Social
          </label>
          <input
            type="text"
            name="name"
            className="w-full border px-3 py-2 bg-gray-100 dark:bg-dark-bg border-gray-300 dark:border-dark-border text-gray-800 dark:text-dark-text"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>
        {/* CNPJ */}
        <div>
          <label className="block mb-1 text-gray-800 dark:text-dark-text">
            CNPJ
          </label>
          <input
            type="text"
            name="cnpj"
            className="w-full border px-3 py-2 bg-gray-100 dark:bg-dark-bg border-gray-300 dark:border-dark-border text-gray-800 dark:text-dark-text"
            value={formData.cnpj}
            onChange={handleChange}
            required
            maxLength={14}
            disabled={type === "edit"}
          />
        </div>
        {/* Inscrição Estadual */}
        <div>
          <label className="block mb-1 text-gray-800 dark:text-dark-text">
            Inscrição Estadual
          </label>
          <input
            type="text"
            name="ie"
            className="w-full border px-3 py-2 bg-gray-100 dark:bg-dark-bg border-gray-300 dark:border-dark-border text-gray-800 dark:text-dark-text"
            value={formData.ie}
            onChange={handleChange}
          />
        </div>
        {/* Email */}
        <div>
          <label className="block mb-1 text-gray-800 dark:text-dark-text">
            E-mail
          </label>
          <input
            type="text"
            name="email"
            className="w-full border px-3 py-2 bg-gray-100 dark:bg-dark-bg border-gray-300 dark:border-dark-border text-gray-800 dark:text-dark-text"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>
        {/* Telefone */}
        <div>
          <label className="block mb-1 text-gray-800 dark:text-dark-text">
            Telefone
          </label>
          <input
            type="tel"
            name="phone"
            className="w-full border px-3 py-2 bg-gray-100 dark:bg-dark-bg border-gray-300 dark:border-dark-border text-gray-800 dark:text-dark-text"
            value={formData.phone}
            onChange={handleChange}
          />
        </div>
        {/* Regime */}
        <div>
          <label className="block mb-1 text-gray-800 dark:text-dark-text">
            Regime
          </label>
          <select
            name="rule"
            className="w-full border px-3 py-2 bg-gray-100 dark:bg-dark-bg border-gray-300 dark:border-dark-border text-gray-800 dark:text-dark-text"
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
          <label className="block mb-1 text-gray-800 dark:text-dark-text">
            Classificação
          </label>
          <select
            name="classi"
            className="w-full border px-3 py-2 bg-gray-100 dark:bg-dark-bg border-gray-300 dark:border-dark-border text-gray-800 dark:text-dark-text"
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
          <label className="block mb-1 text-gray-800 dark:text-dark-text">
            UF
          </label>
          <select
            name="uf"
            className="w-full border px-3 py-2 bg-gray-100 dark:bg-dark-bg border-gray-300 dark:border-dark-border text-gray-800 dark:text-dark-text"
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
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Responsável pela Empresa */}
        <div>
          <label className="block mb-1 text-gray-800 dark:text-dark-text">
            Contato na Empresa
          </label>
          <input
            type="text"
            name="contact"
            className="w-full border px-3 py-2 bg-gray-100 dark:bg-dark-bg border-gray-300 dark:border-dark-border text-gray-800 dark:text-dark-text"
            value={formData.contact}
            onChange={handleChange}
            placeholder="Com quem podemos entrar em contato."
            required
          />
        </div>
        {/* Início do Contrato */}
        <div>
          <label className="block mb-1 text-gray-800 dark:text-dark-text">
            Início do Contrato
          </label>
          <input
            type="date"
            name="contractInit"
            className="w-full border px-3 py-2 bg-gray-100 dark:bg-dark-bg border-gray-300 dark:border-dark-border text-gray-800 dark:text-dark-text"
            value={formData.contractInit}
            onChange={handleChange}
            required
          />
        </div>
      </div>

      <div className="flex items-center mb-4">
        {/* Empresa aberta pela Contelb? */}
        <input
          type="checkbox"
          name="openedByUs"
          checked={formData.openedByUs}
          onChange={handleChange}
          className="mr-2"
        />
        <label className="text-gray-800 dark:text-dark-text">
          Empresa aberta pela Contelb?
        </label>
      </div>

      {/* Exibir o campo 'Informações Importantes' apenas no modo de criação */}
      {type === "add" && (
        <>
          {/* Informações Importantes */}
          <div className="mb-4">
            <label className="block mb-1 text-gray-800 dark:text-dark-text">
              Informações Importantes
            </label>
            <textarea
              name="important_info"
              className="w-full border px-3 py-2 bg-gray-100 dark:bg-dark-bg border-gray-300 dark:border-dark-border text-gray-800 dark:text-dark-text"
              value={formData.important_info}
              onChange={handleChange}
            ></textarea>
          </div>
        </>
      )}

      {/* Exibir campos adicionais apenas no modo de edição */}
      {type === "edit" && (
        <>
          {/* Responsável Fiscal */}
          <div className="mb-4">
            <label className="block mb-1 text-gray-800 dark:text-dark-text">
              Responsável Fiscal
            </label>
            <select
              name="respFiscalId"
              className="w-full border px-3 py-2 bg-gray-100 dark:bg-dark-bg border-gray-300 dark:border-dark-border text-gray-800 dark:text-dark-text"
              value={formData.respFiscalId}
              onChange={handleChange}
            >
              <option value="">Selecione o responsável fiscal</option>
              {fiscalUsers.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
          </div>

          {/* Responsável Contábil */}
          <div className="mb-4">
            <label className="block mb-1 text-gray-800 dark:text-dark-text">
              Responsável Contábil
            </label>
            <select
              name="respContabilId"
              className="w-full border px-3 py-2 bg-gray-100 dark:bg-dark-bg border-gray-300 dark:border-dark-border text-gray-800 dark:text-dark-text"
              value={formData.respContabilId}
              onChange={handleChange}
            >
              <option value="">Selecione o responsável contábil</option>
              {contabilUsers.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
          </div>

          {/* Responsável DP */}
          <div className="mb-4">
            <label className="block mb-1 text-gray-800 dark:text-dark-text">
              Responsável DP
            </label>
            <select
              name="respDpId"
              className="w-full border px-3 py-2 bg-gray-100 dark:bg-dark-bg border-gray-300 dark:border-dark-border text-gray-800 dark:text-dark-text"
              value={formData.respDpId}
              onChange={handleChange}
            >
              <option value="">Selecione o responsável DP</option>
              {dpUsers.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
          </div>
        </>
      )}

      {/* Observações */}
      <div className="mb-4">
        <label className="block mb-1 text-gray-800 dark:text-dark-text">
          Observações
        </label>
        <textarea
          name="obs"
          className="w-full border px-3 py-2 bg-gray-100 dark:bg-dark-bg border-gray-300 dark:border-dark-border text-gray-800 dark:text-dark-text"
          value={formData.obs}
          onChange={handleChange}
        ></textarea>
      </div>

      {/* Botões */}
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
          className="bg-blue-500 dark:bg-accent-blue text-white px-4 py-2 rounded"
        >
          Salvar
        </button>
      </div>
    </form>
  );
};

export default CompanyForm;
