import React, { useState } from 'react';
import { FileText, Calendar, Send, ArrowLeft, MapPin, Phone, Sparkles, Loader, AlertCircle, CheckCircle2 } from 'lucide-react';
import { createDemande } from '../../../api/Demande.Api';
import { updateNeed } from '../../../api/AI.api';

function ReserverService({ setCommander, service }) {
  const [loadingAI, setLoadingAI] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState({});
  const [form, setForm] = useState({
    description: '',
    date: '', 
    adresse: '',
    numeroTelephone: ''
  });

  const validateForm = () => {
    const newErrors = {};
    if (!form.description) newErrors.description = "Veuillez décrire votre besoin.";
    if (!form.date) newErrors.date = "La date est obligatoire.";
    
    const selectedDate = new Date(form.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selectedDate < today) newErrors.date = "Choisissez une date aujourd'hui ou dans le futur.";

    if (!form.adresse) newErrors.adresse = "L'adresse d'intervention est requise.";
    if (!form.numeroTelephone) newErrors.numeroTelephone = "Le numéro est requis.";
    if (!form.numeroTelephone.match(/^(?:\+216|216)?[2-9]\d{7}$/)) newErrors.numeroTelephone = "Format de numéro invalide.";

    setError(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    
    if (!validateForm()) return;
    setLoading(true);
    
    const formData = {
      service: service._id,
      description: form.description,
      prix: Number(service.prix),
      dateIntervention: form.date,
      adresse: form.adresse,
      numeroTelephone: form.numeroTelephone
    };

    try {
      await createDemande(formData);
      setIsSuccess(true);
      // On attend 2 secondes avant de fermer pour que l'utilisateur voit le succès
      setTimeout(() => setCommander(false), 2000);
    } catch (err) {
      const backendMessage = err.response?.data?.message || "Une erreur est survenue lors de l'envoi.";
      setSubmitError(backendMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateNeed = async () => {
    if (!form.description) return;
    setLoadingAI(true);
    try {
      const des = { topic: form.description };
      const updatedDescription = await updateNeed(des);
      setForm(prev => ({ ...prev, description: updatedDescription.reformulatedNeed }));
    } catch (error) {
      console.error("AI Error:", error);
    } finally {
      setLoadingAI(false);
    }
  };

  // Si succès, on affiche un message propre au lieu d'une alerte
  if (isSuccess) {
    return (
      <div className="max-w-2xl mx-auto bg-white rounded-3xl p-12 shadow-2xl border border-slate-100 text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 size={40} className="text-green-600" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 mb-2">Demande envoyée !</h2>
        <p className="text-slate-500">Votre commande a été traitée avec succès.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-3xl p-8 shadow-2xl border border-slate-100">
      <div className="mb-8">
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Passer une commande</h2>
        <p className="text-slate-500 text-sm italic">Service : <span className="font-bold text-blue-600">{service?.titre}</span></p>
      </div>

      {submitError && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-800 rounded-r-xl flex items-center gap-3">
          <AlertCircle size={20} className="shrink-0" />
          <p className="text-sm font-bold">{submitError}</p>
        </div>
      )}

      <div className="space-y-6">
        {/* Adresse */}
        <div className="space-y-1">
          <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1 ml-1">
            <MapPin size={12} /> Adresse complète
          </label>
          <input 
            className={`w-full bg-slate-50 border-2 ${error.adresse ? 'border-red-200 bg-red-50/30' : 'border-slate-100'} rounded-2xl p-4 text-sm focus:ring-4 focus:ring-blue-500/5 focus:bg-white focus:border-blue-500 outline-none transition-all`} 
            type="text" 
            placeholder="N°, Rue, Ville, Gouvernorat..."
            value={form.adresse}
            onChange={(e) => setForm({...form, adresse: e.target.value})}
          />
          {error.adresse && <p className="text-red-600 text-xs font-bold mt-1 ml-2">{error.adresse}</p>}
        </div>

        {/* Grille Téléphone / Date */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1 ml-1">
              <Phone size={12} /> Téléphone
            </label>
            <input 
              className={`w-full bg-slate-50 border-2 ${error.numeroTelephone ? 'border-red-200 bg-red-50/30' : 'border-slate-100'} rounded-2xl p-4 text-sm focus:ring-4 focus:ring-blue-500/5 focus:bg-white focus:border-blue-500 outline-none transition-all`} 
              type="tel" 
              placeholder="Ex: 216XXXXXXXX"
              value={form.numeroTelephone}
              onChange={(e) => setForm({...form, numeroTelephone: e.target.value})}
            />
            {error.numeroTelephone && <p className="text-red-600 text-xs font-bold mt-1 ml-2">{error.numeroTelephone}</p>}
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1 ml-1">
              <Calendar size={12} /> Date souhaitée
            </label>
            <input 
              className={`w-full bg-slate-50 border-2 ${error.date ? 'border-red-200 bg-red-50/30' : 'border-slate-100'} rounded-2xl p-4 text-sm focus:ring-4 focus:ring-blue-500/5 focus:bg-white focus:border-blue-500 outline-none transition-all`} 
              type="date" 
              value={form.date}
              onChange={(e) => setForm({...form, date: e.target.value})}
            />
            {error.date && <p className="text-red-600 text-xs font-bold mt-1 ml-2">{error.date}</p>}
          </div>
        </div>

        {/* Description & AI Button */}
        <div className="space-y-2 pt-2">
          <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1 ml-1">
            <FileText size={12} /> Détails de votre besoin
          </label>
          <textarea 
            className={`w-full bg-slate-50 border-2 ${error.description ? 'border-red-200 bg-red-50/30' : 'border-slate-100'} rounded-2xl p-4 text-sm focus:ring-4 focus:ring-blue-500/5 focus:bg-white focus:border-blue-500 outline-none transition-all resize-none min-h-[130px]`} 
            placeholder="Décrivez votre besoin simplement..."
            value={form.description}
            onChange={(e) => setForm({...form, description: e.target.value})}
          />
          {error.description && <p className="text-red-600 text-xs font-bold mt-1 ml-2">{error.description}</p>}

          <div className="flex flex-col sm:flex-row items-center gap-4 bg-blue-50/50 p-4 rounded-2xl border border-blue-100/50">
            <button 
              type="button"
              onClick={handleUpdateNeed} 
              disabled={loadingAI || !form.description}
              className="relative whitespace-nowrap px-6 py-3.5 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl font-black text-[10px] flex items-center gap-2 shadow-lg shadow-blue-200 hover:shadow-blue-300 transition-all active:scale-95 disabled:opacity-50 tracking-widest group"
            >
              {loadingAI ? <Loader size={14} className="animate-spin" /> : <><Sparkles size={14} /> AMÉLIORER AVEC AI</>}
            </button>
            <p className="text-[11px] text-slate-600 font-medium">
               ✨ Écrivez normalement, l'IA reformulera tout pour le professionnel.
            </p>
          </div>
        </div>

        {/* Actions finales */}
        <div className="flex gap-3 pt-6 border-t border-slate-50">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 bg-slate-900 hover:bg-black text-white rounded-2xl py-4 font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-xl shadow-slate-200 disabled:opacity-50"
          >
            {loading ? <Loader className="animate-spin" /> : <><Send size={16} /> Envoyer la demande</>}
          </button>
          <button 
            type="button"
            onClick={() => setCommander(false)} 
            className="px-6 py-4 text-slate-400 font-bold text-xs uppercase tracking-widest hover:text-slate-600 transition-colors"
          >
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
}

export default ReserverService;