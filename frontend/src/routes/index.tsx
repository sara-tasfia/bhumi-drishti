import { createFileRoute } from '@tanstack/react-router'
import React, { useState, useEffect } from 'react'
import {
  Sprout,
  Mic,
  Camera,
  MapPin,
  Search,
  CheckCircle2,
  Users,
  Briefcase,
  Languages,
  Sparkles,
  ChevronDown,
  Moon,
  Sun,
  Building2
} from 'lucide-react'

import { AstryxCard, AstryxButton, AstryxBadge } from '../components/astryx/AstryxComponents'
import { VoiceInputModal, CameraInputModal } from '../components/farmer/FarmerComponents'
import { LandIntelligenceCard } from '../components/farmer/LandIntelligenceCard'
import { NdviMap } from '../components/map/NdviMap'
import { OutlookCard } from '../components/outlook/OutlookCard'
import { OfficerDashboard } from '../components/officer/OfficerDashboard'
import { DisclaimerBanner } from '../components/outlook/DisclaimerBanner'
import { translations } from '../i18n/translations'
import type { Language } from '../i18n/translations'

import {
  fetchDistricts,
  fetchCrops,
  fetchUpazilas,
  runPrediction,
  locateGps,
  submitTextQuery,
  searchLocations,
  FALLBACK_DISTRICTS,
  FALLBACK_CROPS,
  UPAZILAS
} from '../services/api'
import type {
  District,
  Crop,
  Upazila,
  PredictionResult
} from '../services/api'

export const Route = createFileRoute('/')({
  component: BhumiDrishtiApp,
})

function BhumiDrishtiApp() {
  const [lang, setLang] = useState<Language>('bn')
  const [isDark, setIsDark] = useState<boolean>(false)
  const [mode, setMode] = useState<'farmer' | 'officer'>('farmer')
  const [districts, setDistricts] = useState<District[]>(FALLBACK_DISTRICTS)
  const [crops, setCrops] = useState<Crop[]>(FALLBACK_CROPS)
  const [upazilas, setUpazilas] = useState<Upazila[]>(UPAZILAS)

  const [selectedDistrictId, setSelectedDistrictId] = useState<string>('rangpur')
  const [selectedUpazilaId, setSelectedUpazilaId] = useState<string>('')
  const [selectedCropId, setSelectedCropId] = useState<string>('aman_rice')
  const [activeSymptoms, setActiveSymptoms] = useState<string[]>([])

  const [predictionData, setPredictionData] = useState<PredictionResult | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [mounted, setMounted] = useState<boolean>(false)

  // Modals & search state
  const [isVoiceOpen, setIsVoiceOpen] = useState(false)
  const [isCameraOpen, setIsCameraOpen] = useState(false)
  const [textSearch, setTextSearch] = useState('')
  const [showSearchDropdown, setShowSearchDropdown] = useState(false)
  const [gpsLoading, setGpsLoading] = useState(false)
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null)

  const t = translations[lang]

  useEffect(() => {
    setMounted(true)
    const savedTheme = localStorage.getItem('bhumi_theme')
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
    const enableDark = savedTheme === 'dark' || (!savedTheme && prefersDark)
    setIsDark(enableDark)
    if (enableDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    loadInitialData()
  }, [])

  const toggleDarkMode = () => {
    const nextDark = !isDark
    setIsDark(nextDark)
    if (nextDark) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('bhumi_theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('bhumi_theme', 'light')
    }
  }

  const loadInitialData = async () => {
    try {
      const [distList, cropList, upzList] = await Promise.all([fetchDistricts(), fetchCrops(), fetchUpazilas()])
      setDistricts(distList)
      setCrops(cropList)
      if (upzList && upzList.length > 0) setUpazilas(upzList)
      executePrediction('rangpur', 'aman_rice', '')
    } catch (e) {
      console.error(e)
    }
  }

  const executePrediction = async (distId: string, cropId: string, upzId?: string, symptoms?: string[]) => {
    setLoading(true)
    try {
      const res = await runPrediction(distId, cropId, upzId, symptoms)
      setPredictionData(res)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleGpsDetect = () => {
    if (!navigator.geolocation) {
      alert(lang === 'bn' ? 'আপনার ডিভাইসে GPS সমর্থিত নয়।' : 'GPS is not supported on this device.')
      return
    }
    setGpsLoading(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await locateGps(pos.coords.latitude, pos.coords.longitude)
          if (res && res.district_id) {
            setSelectedDistrictId(res.district_id)
            const dispName = lang === 'bn' ? res.name_bn : res.name_en
            setFeedbackMsg(lang === 'bn' ? `📍 অবস্থান পাওয়া গেছে: ${dispName}` : `📍 Location detected: ${dispName}`)
            executePrediction(res.district_id, selectedCropId, activeSymptoms)
          }
        } catch (e) {
          console.error(e)
          setSelectedDistrictId('dinajpur')
          setFeedbackMsg(lang === 'bn' ? '📍 অবস্থান নির্ধারণ করা হয়েছে: দিনাজপুর' : '📍 Location set: Dinajpur')
          executePrediction('dinajpur', selectedCropId, activeSymptoms)
        } finally {
          setGpsLoading(false)
        }
      },
      (err) => {
        console.warn(err)
        setSelectedDistrictId('dinajpur')
        setFeedbackMsg(lang === 'bn' ? '📍 ডেমো অবস্থান: দিনাজপুর' : '📍 Location set: Dinajpur')
        executePrediction('dinajpur', selectedCropId, activeSymptoms)
        setGpsLoading(false)
      },
      { timeout: 8000 }
    )
  }

  const handleMultimodalDetected = (data: { districtId: string; cropId: string; upazilaId?: string; symptoms?: string[] }) => {
    setSelectedDistrictId(data.districtId)
    setSelectedCropId(data.cropId)
    if (data.upazilaId) setSelectedUpazilaId(data.upazilaId)
    if (data.symptoms) setActiveSymptoms(data.symptoms)

    const distObj = districts.find((d) => d.id === data.districtId) || currentDistrictObj
    const cropObj = crops.find((c) => c.id === data.cropId) || currentCropObj
    const upzObj = data.upazilaId ? upazilas.find((u) => u.id === data.upazilaId) : null
    const distName = lang === 'bn' ? distObj?.name_bn : distObj?.name_en
    const cropName = lang === 'bn' ? cropObj?.name_bn : cropObj?.name_en
    const upzName = upzObj ? (lang === 'bn' ? upzObj.name_bn : upzObj.name_en) : ''

    const locLabel = upzName ? `${upzName}, ${distName}` : distName
    setFeedbackMsg(lang === 'bn' ? `শনাক্ত: ${locLabel} • ${cropName}` : `Detected: ${locLabel} • ${cropName}`)

    executePrediction(data.districtId, data.cropId, data.upazilaId || selectedUpazilaId, data.symptoms)
  }

  const handleTextSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setShowSearchDropdown(false)
    const query = textSearch.trim()
    if (!query) return
    setLoading(true)
    try {
      const res = await submitTextQuery(query)
      if (res && res.extracted) {
        const nextDistId = res.extracted.district_id || selectedDistrictId
        const nextCropId = res.extracted.crop_id || selectedCropId
        const nextUpzId = res.extracted.upazila_id || ''
        const symptoms = res.extracted.visual_symptoms || []

        setSelectedDistrictId(nextDistId)
        setSelectedCropId(nextCropId)
        setSelectedUpazilaId(nextUpzId)
        if (symptoms.length > 0) setActiveSymptoms(symptoms)

        const distObj = districts.find((d) => d.id === nextDistId) || currentDistrictObj
        const cropObj = crops.find((c) => c.id === nextCropId) || currentCropObj
        const upzObj = nextUpzId ? upazilas.find((u) => u.id === nextUpzId) : null
        const distName = lang === 'bn' ? distObj?.name_bn : distObj?.name_en
        const cropName = lang === 'bn' ? cropObj?.name_bn : cropObj?.name_en
        const upzName = upzObj ? (lang === 'bn' ? upzObj.name_bn : upzObj.name_en) : ''

        const locLabel = upzName ? `${upzName}, ${distName}` : distName
        setFeedbackMsg(lang === 'bn' ? `🔍 অনুসন্ধান ফলাফল: ${locLabel} • ${cropName}` : `🔍 Search Result: ${locLabel} • ${cropName}`)
        executePrediction(nextDistId, nextCropId, nextUpzId, symptoms)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const currentDistrictObj = districts.find((d) => d.id === selectedDistrictId) || {
    id: 'rangpur',
    name_en: 'Rangpur',
    name_bn: 'রংপুর',
    division: 'Rangpur',
    lat: 25.7439,
    lon: 89.2752,
    soil_type: 'Teesta Floodplain Loam',
    soil_ph: 6.2,
    soil_organic_carbon: 1.15,
    vulnerabilities: ['drought']
  }

  const currentCropObj = crops.find((c) => c.id === selectedCropId) || {
    id: 'aman_rice',
    name_en: 'T. Aman Rice',
    name_bn: 'রোপা আমন ধান',
    season: 'Kharif-2',
    season_bn: 'খরিপ-২',
    baseline_yield_tha: 2.85
  }

  const districtUpazilas = upazilas.filter((u) => u.district_id === selectedDistrictId)
  const currentUpazilaObj = upazilas.find((u) => u.id === selectedUpazilaId)

  return (
    <div className="max-w-5xl mx-auto px-4 py-5 sm:py-8 space-y-6">
      {/* Top Header */}
      <header className="bg-white border border-[#d0d7cd] rounded-2xl p-4 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 bg-[#1b4d3e] text-white rounded-xl shadow-sm">
              <Sprout className="w-6 h-6" />
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1c2826] tracking-tight">
              {t.appTitle} <span className="text-base sm:text-lg font-normal text-[#6f807a]">({t.appTitleEn})</span>
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[#43544f]">
            {t.appSubtitle}
          </p>
        </div>

        {/* Controls: Dark Mode + Language Switcher + Dual Mode */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Dark Mode Toggle Button */}
          <button
            onClick={toggleDarkMode}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-bold bg-white dark:bg-[#1a2622] hover:bg-[#f4f6f2] dark:hover:bg-[#253731] border border-[#d0d7cd] dark:border-[#344d44] text-[#1b4d3e] dark:text-[#4ade80] shadow-sm cursor-pointer transition-all active:scale-95"
            title={isDark ? "Light Mode" : "Dark Mode"}
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-[#1b4d3e]" />}
            <span>{isDark ? t.lightMode : t.darkMode}</span>
          </button>

          {/* Language Switcher Button */}
          <button
            onClick={() => setLang(lang === 'bn' ? 'en' : 'bn')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-bold bg-white dark:bg-[#1a2622] hover:bg-[#f4f6f2] dark:hover:bg-[#253731] border border-[#d0d7cd] dark:border-[#344d44] text-[#1b4d3e] dark:text-[#4ade80] shadow-sm cursor-pointer transition-all active:scale-95"
            title="Toggle Language"
          >
            <Languages className="w-4 h-4 text-[#1b4d3e] dark:text-[#4ade80]" />
            <span>{t.switchLang}</span>
          </button>

          {/* Mode Switcher */}
          <div className="flex bg-[#f4f6f2] p-1.5 rounded-xl border border-[#d0d7cd] shrink-0">
            <button
              onClick={() => setMode('farmer')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                mode === 'farmer'
                  ? 'bg-[#1b4d3e] text-white shadow-sm'
                  : 'text-[#43544f] hover:text-[#1c2826]'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>{t.modeFarmer}</span>
            </button>
            <button
              onClick={() => setMode('officer')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                mode === 'officer'
                  ? 'bg-[#1b4d3e] text-white shadow-sm'
                  : 'text-[#43544f] hover:text-[#1c2826]'
              }`}
            >
              <Briefcase className="w-4 h-4" />
              <span>{t.modeOfficer}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Mode-Specific Interaction Area */}
      {mode === 'farmer' ? (
        <div className="space-y-6">
          {/* Quick Input Bar */}
          <AstryxCard className="bg-[#fdfbf7] border-[#dcc19e]">
            <div className="mb-3 text-center sm:text-left">
              <span className="text-xs font-bold text-[#a97843] uppercase tracking-wider block mb-1">
                {t.farmerTag}
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-[#1c2826]">
                {t.farmerHeadline}
              </h2>
            </div>

            {/* 3 Large Tactile Farmer Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-4">
              {/* Voice Button */}
              <AstryxButton
                variant="primary"
                size="farmer"
                onClick={() => setIsVoiceOpen(true)}
                className="w-full"
              >
                <Mic className="w-6 h-6 text-[#86efac]" />
                <div className="text-left leading-tight">
                  <span className="block text-base font-bold">{t.btnVoice}</span>
                  <span className="text-xs font-normal opacity-90">{t.btnVoiceSub}</span>
                </div>
              </AstryxButton>

              {/* Camera Button */}
              <AstryxButton
                variant="earth"
                size="farmer"
                onClick={() => setIsCameraOpen(true)}
                className="w-full"
              >
                <Camera className="w-6 h-6 text-[#fde68a]" />
                <div className="text-left leading-tight">
                  <span className="block text-base font-bold">{t.btnCamera}</span>
                  <span className="text-xs font-normal opacity-90">{t.btnCameraSub}</span>
                </div>
              </AstryxButton>

              {/* GPS 1-Tap Location Button */}
              <AstryxButton
                variant="outline"
                size="farmer"
                onClick={handleGpsDetect}
                disabled={gpsLoading}
                className="w-full"
              >
                <MapPin className="w-6 h-6 text-[#c84b31]" />
                <div className="text-left leading-tight">
                  <span className="block text-base font-bold">{t.btnLocation}</span>
                  <span className="text-xs font-normal text-[#6f807a]">
                    {gpsLoading ? t.btnLocationLoading : t.btnLocationSub}
                  </span>
                </div>
              </AstryxButton>
            </div>

            {/* Optional Freeform Bangla/English Search with Live Thana/Upazila & District Autocomplete */}
            <div className="relative mt-2">
              <form onSubmit={handleTextSearchSubmit} className="relative">
                <input
                  type="text"
                  value={textSearch}
                  onFocus={() => setShowSearchDropdown(true)}
                  onChange={(e) => {
                    setTextSearch(e.target.value)
                    setShowSearchDropdown(true)
                  }}
                  placeholder={t.searchPlaceholder}
                  className="w-full bg-white dark:bg-[#182823] border border-[#d0d7cd] dark:border-[#314d43] rounded-xl pl-10 pr-24 py-3 text-sm text-[#1c2826] dark:text-[#f1f7f4] focus:outline-none focus:ring-2 focus:ring-[#1b4d3e]"
                />
                <Search className="w-4 h-4 text-[#6f807a] absolute left-3.5 top-3.5" />
                <button
                  type="submit"
                  disabled={loading}
                  className="absolute right-2 top-2 px-3 py-1.5 bg-[#1b4d3e] text-white rounded-lg text-xs font-semibold hover:bg-[#166534] cursor-pointer"
                >
                  {t.btnSearch}
                </button>
              </form>

              {/* Autocomplete Suggestions Dropdown */}
              {showSearchDropdown && textSearch.trim().length >= 2 && (
                <div className="absolute left-0 right-0 top-full mt-1.5 z-40 bg-white dark:bg-[#162620] border border-[#d0d7cd] dark:border-[#2f463d] rounded-xl shadow-lg max-h-60 overflow-y-auto divide-y divide-[#f4f6f2] dark:divide-[#21352e]">
                  {/* Matching Upazilas */}
                  {searchLocations(textSearch).upazilas.slice(0, 6).map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => {
                        setSelectedDistrictId(u.district_id)
                        setSelectedUpazilaId(u.id)
                        setTextSearch(lang === 'bn' ? `${u.name_bn}, ${u.district_name_bn}` : `${u.name_en}, ${u.district_name_en}`)
                        setShowSearchDropdown(false)
                        const upzName = lang === 'bn' ? u.name_bn : u.name_en
                        const dName = lang === 'bn' ? u.district_name_bn : u.district_name_en
                        setFeedbackMsg(lang === 'bn' ? `📍 ${upzName}, ${dName}` : `📍 ${upzName}, ${dName}`)
                        executePrediction(u.district_id, selectedCropId, u.id, activeSymptoms)
                      }}
                      className="w-full px-4 py-2.5 flex items-center justify-between text-left text-xs hover:bg-[#f0fdf4] dark:hover:bg-[#1c3329] cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm">🏛️</span>
                        <div>
                          <span className="font-bold text-[#1c2826] dark:text-[#f1f7f4]">
                            {lang === 'bn' ? u.name_bn : u.name_en}
                          </span>
                          <span className="text-[#6f807a] dark:text-[#92aba2] ml-1.5">
                            ({lang === 'bn' ? u.district_name_bn : u.district_name_en} {lang === 'bn' ? 'জেলা' : 'District'})
                          </span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 bg-[#f0fdf4] dark:bg-[#1c382b] text-[#166534] dark:text-[#4ade80] rounded text-[10px] font-semibold">
                        {lang === 'bn' ? 'থানা / উপজেলা' : 'Upazila'}
                      </span>
                    </button>
                  ))}

                  {/* Matching Districts */}
                  {districts
                    .filter(d => 
                      d.name_bn.includes(textSearch.trim()) || 
                      d.name_en.toLowerCase().includes(textSearch.trim().toLowerCase())
                    )
                    .slice(0, 3)
                    .map((d) => (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => {
                          setSelectedDistrictId(d.id)
                          setSelectedUpazilaId('')
                          setTextSearch(lang === 'bn' ? d.name_bn : d.name_en)
                          setShowSearchDropdown(false)
                          const dName = lang === 'bn' ? d.name_bn : d.name_en
                          setFeedbackMsg(lang === 'bn' ? `📍 জেলা: ${dName}` : `📍 District: ${dName}`)
                          executePrediction(d.id, selectedCropId, '', activeSymptoms)
                        }}
                        className="w-full px-4 py-2.5 flex items-center justify-between text-left text-xs hover:bg-[#f0fdf4] dark:hover:bg-[#1c3329] cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm">📍</span>
                          <span className="font-bold text-[#1c2826] dark:text-[#f1f7f4]">
                            {lang === 'bn' ? d.name_bn : d.name_en}
                          </span>
                          <span className="text-[#6f807a] dark:text-[#92aba2] ml-1">
                            ({d.division} {lang === 'bn' ? 'বিভাগ' : 'Division'})
                          </span>
                        </div>
                        <span className="px-2 py-0.5 bg-[#eff6ff] dark:bg-[#152a40] text-[#1d4ed8] dark:text-[#93c5fd] rounded text-[10px] font-semibold">
                          {lang === 'bn' ? 'জেলা' : 'District'}
                        </span>
                      </button>
                    ))}
                </div>
              )}
            </div>

            {/* Current Selection Confirmation & Interactive Dropdowns */}
            <div className="mt-4 pt-3 border-t border-[#ebdcc5] dark:border-[#283f36] flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="text-[#6f807a] dark:text-[#92aba2] font-medium">{t.currentCropArea}</span>

                {/* District Interactive Dropdown */}
                <div className="relative inline-flex items-center">
                  <select
                    value={selectedDistrictId}
                    onChange={(e) => {
                      const newDistId = e.target.value
                      setSelectedDistrictId(newDistId)
                      setSelectedUpazilaId('')
                      executePrediction(newDistId, selectedCropId, '', activeSymptoms)
                      const dObj = districts.find((d) => d.id === newDistId)
                      const dName = lang === 'bn' ? dObj?.name_bn : dObj?.name_en
                      setFeedbackMsg(lang === 'bn' ? `📍 এলাকা: ${dName}` : `📍 Location: ${dName}`)
                    }}
                    aria-label={lang === 'bn' ? 'জেলা নির্বাচন করুন' : 'Select District'}
                    className="appearance-none bg-[#f0fdf4] dark:bg-[#162a22] hover:bg-[#dcfce7] text-[#14532d] dark:text-[#86efac] font-bold text-xs py-1.5 pl-6 pr-7 rounded-lg border border-[#86efac] dark:border-[#2f5c49] focus:outline-none focus:ring-2 focus:ring-[#16a34a] cursor-pointer shadow-xs transition-colors"
                  >
                    {districts.map((d) => (
                      <option key={d.id} value={d.id}>
                        {lang === 'bn' ? d.name_bn : d.name_en}
                      </option>
                    ))}
                  </select>
                  <span className="absolute left-2 pointer-events-none text-xs">📍</span>
                  <ChevronDown className="w-3.5 h-3.5 text-[#14532d] dark:text-[#86efac] absolute right-2 pointer-events-none" />
                </div>

                {/* Thana / Upazila Interactive Dropdown */}
                <div className="relative inline-flex items-center">
                  <select
                    value={selectedUpazilaId}
                    onChange={(e) => {
                      const newUpzId = e.target.value
                      setSelectedUpazilaId(newUpzId)
                      executePrediction(selectedDistrictId, selectedCropId, newUpzId, activeSymptoms)
                      const upzObj = upazilas.find((u) => u.id === newUpzId)
                      const upzName = lang === 'bn' ? upzObj?.name_bn : upzObj?.name_en
                      const dName = lang === 'bn' ? currentDistrictObj.name_bn : currentDistrictObj.name_en
                      if (newUpzId && upzName) {
                        setFeedbackMsg(lang === 'bn' ? `📍 ${upzName}, ${dName}` : `📍 ${upzName}, ${dName}`)
                      } else {
                        setFeedbackMsg(lang === 'bn' ? `📍 ${dName} জেলা` : `📍 ${dName} District`)
                      }
                    }}
                    aria-label={t.selectUpazila}
                    className="appearance-none bg-[#f0fdf4] dark:bg-[#162a22] hover:bg-[#dcfce7] text-[#14532d] dark:text-[#86efac] font-bold text-xs py-1.5 pl-6 pr-7 rounded-lg border border-[#86efac] dark:border-[#2f5c49] focus:outline-none focus:ring-2 focus:ring-[#16a34a] cursor-pointer shadow-xs transition-colors"
                  >
                    <option value="">{t.allUpazilas}</option>
                    {districtUpazilas.map((u) => (
                      <option key={u.id} value={u.id}>
                        {lang === 'bn' ? u.name_bn : u.name_en}
                      </option>
                    ))}
                  </select>
                  <span className="absolute left-2 pointer-events-none text-xs">🏛️</span>
                  <ChevronDown className="w-3.5 h-3.5 text-[#14532d] dark:text-[#86efac] absolute right-2 pointer-events-none" />
                </div>

                {/* Crop Interactive Dropdown */}
                <div className="relative inline-flex items-center">
                  <select
                    value={selectedCropId}
                    onChange={(e) => {
                      const newCropId = e.target.value
                      setSelectedCropId(newCropId)
                      executePrediction(selectedDistrictId, newCropId, selectedUpazilaId, activeSymptoms)
                      const cObj = crops.find((c) => c.id === newCropId)
                      const cName = lang === 'bn' ? cObj?.name_bn : cObj?.name_en
                      setFeedbackMsg(lang === 'bn' ? `🌱 ফসল: ${cName}` : `🌱 Crop: ${cName}`)
                    }}
                    aria-label={lang === 'bn' ? 'ফসল নির্বাচন করুন' : 'Select Crop'}
                    className="appearance-none bg-[#fdf8f4] dark:bg-[#241c14] hover:bg-[#fef3c7] text-[#78350f] dark:text-[#fde68a] font-bold text-xs py-1.5 pl-6 pr-7 rounded-lg border border-[#fcd34d] dark:border-[#594819] focus:outline-none focus:ring-2 focus:ring-[#d97706] cursor-pointer shadow-xs transition-colors"
                  >
                    {crops.map((c) => (
                      <option key={c.id} value={c.id}>
                        {lang === 'bn' ? c.name_bn : c.name_en} ({lang === 'bn' ? c.season_bn : c.season})
                      </option>
                    ))}
                  </select>
                  <span className="absolute left-2 pointer-events-none text-xs">🌱</span>
                  <ChevronDown className="w-3.5 h-3.5 text-[#78350f] dark:text-[#fde68a] absolute right-2 pointer-events-none" />
                </div>
              </div>
              {feedbackMsg && (
                <span className="text-[#15803d] dark:text-[#4ade80] font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> {feedbackMsg}
                </span>
              )}
            </div>
          </AstryxCard>

          {/* New Core Feature: Land Intelligence & Profitability Engine */}
          <LandIntelligenceCard
            district={currentDistrictObj}
            upazilaId={selectedUpazilaId}
            currentCropId={selectedCropId}
            lang={lang}
            onApplyCrop={(cId) => {
              setSelectedCropId(cId)
              executePrediction(selectedDistrictId, cId, selectedUpazilaId, activeSymptoms)
            }}
          />
        </div>
      ) : (
        <OfficerDashboard
          districts={districts}
          crops={crops}
          selectedDistrict={selectedDistrictId}
          selectedCrop={selectedCropId}
          onDistrictChange={(id) => {
            setSelectedDistrictId(id)
            executePrediction(id, selectedCropId, activeSymptoms)
          }}
          onCropChange={(id) => {
            setSelectedCropId(id)
            executePrediction(selectedDistrictId, id, activeSymptoms)
          }}
          onRunPredict={() => executePrediction(selectedDistrictId, selectedCropId, activeSymptoms)}
          loading={loading}
          predictionData={predictionData}
          lang={lang}
        />
      )}

      {/* Main Prediction & Geospatial Insights */}
      {predictionData && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left Column: Outlook Card & Spoken Advice (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <OutlookCard data={predictionData} lang={lang} />
          </div>

          {/* Right Column: Leaflet NDVI Map (5 cols) */}
          <div className="lg:col-span-5 space-y-3">
            <AstryxCard className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-sm text-[#1c2826] flex items-center gap-1.5">
                  {t.mapTitle}
                </h3>
                <AstryxBadge color="green" size="sm">
                  NDVI {predictionData.features.ndvi_mean}
                </AstryxBadge>
              </div>
              <p className="text-xs text-[#6f807a] mb-3">
                {lang === 'bn' ? currentDistrictObj.name_bn : currentDistrictObj.name_en} — {t.mapSub}
              </p>

              {mounted && (
                <NdviMap
                  district={currentDistrictObj}
                  ndviScore={predictionData.features.ndvi_mean}
                  lang={lang}
                />
              )}
            </AstryxCard>
          </div>
        </div>
      )}

      {/* Official Disclaimer & Data Attribution */}
      <DisclaimerBanner lang={lang} />

      {/* Modals for Voice and Camera */}
      <VoiceInputModal
        isOpen={isVoiceOpen}
        onClose={() => setIsVoiceOpen(false)}
        onDetected={handleMultimodalDetected}
        lang={lang}
      />
      <CameraInputModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onDetected={handleMultimodalDetected}
        lang={lang}
      />
    </div>
  )
}
