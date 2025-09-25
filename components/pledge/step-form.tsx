"use client"

import type React from "react"

import { useEffect, useMemo, useRef, useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"

export type PledgeFormValues = {
  name: string
  mobile: string
  gender: "male" | "female" | "other"
  district: string
  constituency: string
  village: string
}

const MOBILE_IN_PATTERN = /^[6-9]\d{9}$/
const ENGLISH_ONLY_PATTERN = /^[a-zA-Z\s.'-]+$/

const RAJASTHAN_DISTRICTS = [
  "Ajmer",
  "Alwar",
  "Balotra",
  "Banswara",
  "Baran",
  "Barmer",
  "Beawar",
  "Bharatpur",
  "Bhilwara",
  "Bikaner",
  "Bundi",
  "Chittorgarh",
  "Churu",
  "Dausa",
  "Deeg",
  "Dholpur",
  "Didwana-Kuchaman",
  "Dungarpur",
  "Ganganagar",
  "Hanumangarh",
  "Jaipur",
  "Jaisalmer",
  "Jalore",
  "Jhalawar",
  "Jhunjhunu",
  "Jodhpur",
  "Karauli",
  "Khairthal-Tijara",
  "Kota",
  "Kotputli-Behror",
  "Nagaur",
  "Pali",
  "Phalodi",
  "Pratapgarh",
  "Rajsamand",
  "Salumbar",
  "Sawai Madhopur",
  "Sikar",
  "Sirohi",
  "Tonk",
  "Udaipur"
]

const DISTRICT_CONSTITUENCIES: Record<string, Array<{number: number, name: string}>> = {
  "Udaipur": [
    { number: 149, name: "Gogunda (ST)" },
    { number: 150, name: "Jhadol (ST)" },
    { number: 151, name: "Kherwara (ST)" },
    { number: 152, name: "Udaipur Rural (ST)" },
    { number: 153, name: "Udaipur" },
    { number: 154, name: "Mavli" },
    { number: 155, name: "Vallabhnagar" },
    { number: 156, name: "Salumber (ST)" }
  ],
  "Tonk": [
    { number: 94, name: "Malpura" },
    { number: 95, name: "Niwai (SC)" },
    { number: 96, name: "Tonk" },
    { number: 97, name: "Deoli-Uniara" }
  ],
  "Sri Ganganagar": [
    { number: 1, name: "Sadulshahar" },
    { number: 2, name: "Ganganagar" },
    { number: 3, name: "Karanpur" },
    { number: 4, name: "Suratgarh" },
    { number: 5, name: "Raisinghnagar (SC)" },
    { number: 6, name: "Anupgarh (SC)" }
  ],
  "Sirohi": [
    { number: 146, name: "Sirohi" },
    { number: 147, name: "Pindwara-Abu (ST)" },
    { number: 148, name: "Reodar (SC)" }
  ],
  "Sikar": [
    { number: 32, name: "Fatehpur" },
    { number: 33, name: "Lachhmangarh" },
    { number: 34, name: "Dhod (SC)" },
    { number: 35, name: "Sikar" },
    { number: 36, name: "Dantaramgarh" },
    { number: 37, name: "Khandela" },
    { number: 38, name: "Neem Ka Thana" },
    { number: 39, name: "Srimadhopur" }
  ],
  "Sawai Madhopur": [
    { number: 90, name: "Gangapur" },
    { number: 91, name: "Bamanwas (ST)" },
    { number: 92, name: "Sawai Madhopur" },
    { number: 93, name: "Khandar (SC)" }
  ],
  "Rajsamand": [
    { number: 173, name: "Bhim" },
    { number: 174, name: "Kumbhalgarh" },
    { number: 175, name: "Rajsamand" },
    { number: 176, name: "Nathdwara" }
  ],
  "Pratapgarh": [
    { number: 157, name: "Dhariwad (ST)" },
    { number: 172, name: "Pratapgarh (ST)" }
  ],
  "Pali": [
    { number: 116, name: "Jaitaran" },
    { number: 117, name: "Sojat (SC)" },
    { number: 118, name: "Pali" },
    { number: 119, name: "Marwar Junction" },
    { number: 120, name: "Bali" },
    { number: 121, name: "Sumerpur" }
  ],
  "Nagaur": [
    { number: 106, name: "Ladnun" },
    { number: 107, name: "Deedwana" },
    { number: 108, name: "Jayal (SC)" },
    { number: 109, name: "Nagaur" },
    { number: 110, name: "Khinwsar" },
    { number: 111, name: "Merta (SC)" },
    { number: 112, name: "Degana" },
    { number: 113, name: "Makrana" },
    { number: 114, name: "Parbatsar" },
    { number: 115, name: "Nawan" }
  ],
  "Kota": [
    { number: 187, name: "Pipalda" },
    { number: 188, name: "Sangod" },
    { number: 189, name: "Kota North" },
    { number: 190, name: "Kota South" },
    { number: 191, name: "Ladpura" },
    { number: 192, name: "Ramganj Mandi (SC)" }
  ],
  "Karauli": [
    { number: 81, name: "Todabhim (ST)" },
    { number: 82, name: "Hindaun (SC)" },
    { number: 83, name: "Karauli" },
    { number: 84, name: "Sapotra (ST)" }
  ],
  "Jodhpur": [
    { number: 122, name: "Phalodi" },
    { number: 123, name: "Lohawat" },
    { number: 124, name: "Shergarh" },
    { number: 125, name: "Osian" },
    { number: 126, name: "Bhopalgarh (SC)" },
    { number: 127, name: "Sardarpura" },
    { number: 128, name: "Jodhpur" },
    { number: 129, name: "Soorsagar" },
    { number: 130, name: "Luni" },
    { number: 131, name: "Bilara (SC)" }
  ],
  "Jhunjhunu": [
    { number: 25, name: "Pilani (SC)" },
    { number: 26, name: "Surajgarh" },
    { number: 27, name: "Jhunjhunu" },
    { number: 28, name: "Mandawa" },
    { number: 29, name: "Nawalgarh" },
    { number: 30, name: "Udaipurwati" },
    { number: 31, name: "Khetri" }
  ],
  "Jhalawar": [
    { number: 197, name: "Dag (SC)" },
    { number: 198, name: "Jhalrapatan" },
    { number: 199, name: "Khanpur" },
    { number: 200, name: "Manohar Thana" }
  ],
  "Jalore": [
    { number: 141, name: "Ahore" },
    { number: 142, name: "Jalore (SC)" },
    { number: 143, name: "Bhinmal" },
    { number: 144, name: "Sanchore" },
    { number: 145, name: "Raniwara" }
  ],
  "Jaisalmer": [
    { number: 132, name: "Jaisalmer" },
    { number: 133, name: "Pokaran" }
  ],
  "Jaipur": [
    { number: 40, name: "Kotputli" },
    { number: 41, name: "Viratnagar" },
    { number: 42, name: "Shahpura" },
    { number: 43, name: "Chomu" },
    { number: 44, name: "Phulera" },
    { number: 45, name: "Dudu (SC)" },
    { number: 46, name: "Jhotwara" },
    { number: 47, name: "Amber" },
    { number: 48, name: "Jamwa Ramgarh (ST)" },
    { number: 49, name: "Hawa Mahal" },
    { number: 50, name: "Vidhyadhar Nagar" },
    { number: 51, name: "Civil Lines" },
    { number: 52, name: "Kishanpole" },
    { number: 53, name: "Adarsh Nagar" },
    { number: 54, name: "Malviya Nagar" },
    { number: 55, name: "Sanganer" },
    { number: 56, name: "Bagru (SC)" },
    { number: 57, name: "Bassi (ST)" },
    { number: 58, name: "Chaksu (SC)" }
  ],
  "Hanumangarh": [
    { number: 7, name: "Sangaria" },
    { number: 8, name: "Hanumangarh" },
    { number: 9, name: "Pilibanga (SC)" },
    { number: 10, name: "Nohar" },
    { number: 11, name: "Bhadra" }
  ],
  "Dungarpur": [
    { number: 158, name: "Dungarpur (ST)" },
    { number: 159, name: "Aspur (ST)" },
    { number: 160, name: "Sagwara (ST)" },
    { number: 161, name: "Chorasi (ST)" }
  ],
  "Dholpur": [
    { number: 77, name: "Baseri (SC)" },
    { number: 78, name: "Bari" },
    { number: 79, name: "Dholpur" },
    { number: 80, name: "Rajakhera" }
  ],
  "Dausa": [
    { number: 85, name: "Bandikui" },
    { number: 86, name: "Mahuwa" },
    { number: 87, name: "Sikrai (SC)" },
    { number: 88, name: "Dausa" },
    { number: 89, name: "Lalsot (ST)" }
  ],
  "Churu": [
    { number: 19, name: "Sadulpur" },
    { number: 20, name: "Taranagar" },
    { number: 21, name: "Sardarshahar" },
    { number: 22, name: "Churu" },
    { number: 23, name: "Ratangarh" },
    { number: 24, name: "Sujangarh (SC)" }
  ],
  "Chittorgarh": [
    { number: 167, name: "Kapasan (SC)" },
    { number: 168, name: "Begun" },
    { number: 169, name: "Chittorgarh" },
    { number: 170, name: "Nimbahera" },
    { number: 171, name: "Bari Sadri" }
  ],
  "Bundi": [
    { number: 184, name: "Hindoli" },
    { number: 185, name: "Keshoraipatan (SC)" },
    { number: 186, name: "Bundi" }
  ],
  "Bikaner": [
    { number: 12, name: "Khajuwala (SC)" },
    { number: 13, name: "Bikaner West" },
    { number: 14, name: "Bikaner East" },
    { number: 15, name: "Kolayat" },
    { number: 16, name: "Lunkaransar" },
    { number: 17, name: "Dungargarh" },
    { number: 18, name: "Nokha" }
  ],
  "Bhilwara": [
    { number: 177, name: "Asind" },
    { number: 178, name: "Mandal" },
    { number: 179, name: "Sahara" },
    { number: 180, name: "Bhilwara" },
    { number: 181, name: "Shahpura" },
    { number: 182, name: "Jahazpur" },
    { number: 183, name: "Mandalgarh" }
  ],
  "Bharatpur": [
    { number: 70, name: "Kaman" },
    { number: 71, name: "Nagar" },
    { number: 72, name: "Deeg-Kumher" },
    { number: 73, name: "Bharatpur" },
    { number: 74, name: "Nadbai" },
    { number: 75, name: "Weir (SC)" },
    { number: 76, name: "Bayana (SC)" }
  ],
  "Barmer": [
    { number: 134, name: "Sheo" },
    { number: 135, name: "Barmer" },
    { number: 136, name: "Baytoo" },
    { number: 137, name: "Pachpadra" },
    { number: 138, name: "Siwana" },
    { number: 139, name: "Gudamalani" },
    { number: 140, name: "Chohtan (SC)" }
  ],
  "Baran": [
    { number: 193, name: "Anta" },
    { number: 194, name: "Kishanganj (ST)" },
    { number: 195, name: "Baran-Atru (SC)" },
    { number: 196, name: "Chhabra" }
  ],
  "Banswara": [
    { number: 162, name: "Ghatol (ST)" },
    { number: 163, name: "Garhi (ST)" },
    { number: 164, name: "Banswara (ST)" },
    { number: 165, name: "Bagidora (ST)" },
    { number: 166, name: "Kushalgarh (ST)" }
  ],
  "Alwar": [
    { number: 59, name: "Tijara" },
    { number: 60, name: "Kishangarh Bas" },
    { number: 61, name: "Mundawar" },
    { number: 62, name: "Behror" },
    { number: 63, name: "Bansur" },
    { number: 64, name: "Thanagazi" },
    { number: 65, name: "Alwar Rural (SC)" },
    { number: 66, name: "Alwar Urban" },
    { number: 67, name: "Ramgarh" },
    { number: 68, name: "Rajgarh-Laxmangarh (ST)" },
    { number: 69, name: "Kathumar (SC)" }
  ],
  "Ajmer": [
    { number: 98, name: "Kishangarh" },
    { number: 99, name: "Pushkar" },
    { number: 100, name: "Ajmer North" },
    { number: 101, name: "Ajmer South (SC)" },
    { number: 102, name: "Nasirabad" },
    { number: 103, name: "Beawar" },
    { number: 104, name: "Masuda" },
    { number: 105, name: "Kekri" }
  ]
}

export default function StepForm({
  lang,
  strings,
  initialValues,
  onValid,
}: {
  lang: "en" | "hi"
  strings: ReturnType<typeof getStringsMock>
  initialValues?: PledgeFormValues
  onValid: (vals: PledgeFormValues) => void
}) {
  const [values, setValues] = useState<PledgeFormValues>(
    initialValues ?? { name: "", mobile: "", gender: "male", district: "", constituency: "", village: "" },
  )
  const [touched, setTouched] = useState<Record<keyof PledgeFormValues, boolean>>({
    name: false,
    mobile: false,
    gender: false,
    district: false,
    constituency: false,
    village: false,
  })
  const [isSubmittedOnce, setIsSubmittedOnce] = useState(false)
  const [districtOpen, setDistrictOpen] = useState(false)
  const [constituencyOpen, setConstituencyOpen] = useState(false)
  const districtRef = useRef<HTMLDivElement>(null)
  const constituencyRef = useRef<HTMLDivElement>(null)
  const liveRegionRef = useRef<HTMLDivElement>(null)

  const errors = useMemo(() => {
    const e: Partial<Record<keyof PledgeFormValues, string>> = {}
    if (!values.name.trim()) e.name = strings.form.errors.required
    else if (!ENGLISH_ONLY_PATTERN.test(values.name)) e.name = "Name must contain only English letters, spaces, and common punctuation"
    if (!MOBILE_IN_PATTERN.test(values.mobile)) e.mobile = strings.form.errors.mobile
    if (!values.gender) e.gender = strings.form.errors.required
    if (!values.district.trim()) e.district = strings.form.errors.required
    if (values.district && !values.constituency.trim()) e.constituency = strings.form.errors.required
    if (!values.village.trim()) e.village = strings.form.errors.required
    return e
  }, [values, strings])

  const formValid = Object.keys(errors).length === 0

  useEffect(() => {
    if (formValid) onValid(values)
  }, [formValid, onValid, values])

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (districtRef.current && !districtRef.current.contains(event.target as Node)) {
        setDistrictOpen(false)
      }
      if (constituencyRef.current && !constituencyRef.current.contains(event.target as Node)) {
        setConstituencyOpen(false)
      }
    }

    if (districtOpen || constituencyOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [districtOpen, constituencyOpen])

  useEffect(() => {
    if (!isSubmittedOnce) return
    const msgs = Object.values(errors)
    if (msgs.length && liveRegionRef.current) {
      liveRegionRef.current.textContent = msgs[0]
    }
  }, [errors, isSubmittedOnce])

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmittedOnce(true)
    if (formValid) onValid(values)
  }

  return (
    <section aria-labelledby="details-heading">
      <h2 id="details-heading" className="sr-only">
        {strings.form.legend}
      </h2>
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <div className="grid gap-2">
          <Label>{lang === "hi" ? "लिंग" : "Gender"}</Label>
          <div className="flex gap-4">
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="gender"
                value="male"
                checked={values.gender === "male"}
                onChange={() => setValues((v) => ({ ...v, gender: "male" }))}
              />
              {lang === "hi" ? "पुरुष" : "Male"}
            </label>
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="gender"
                value="female"
                checked={values.gender === "female"}
                onChange={() => setValues((v) => ({ ...v, gender: "female" }))}
              />
              {lang === "hi" ? "महिला" : "Female"}
            </label>
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="gender"
                value="other"
                checked={values.gender === "other"}
                onChange={() => setValues((v) => ({ ...v, gender: "other" }))}
              />
              {lang === "hi" ? "अन्य" : "Other"}
            </label>
          </div>
          {errors.gender && (
            <p className="text-xs text-destructive">{errors.gender}</p>
          )}
        </div>
        <div className="grid gap-2">
          <Label htmlFor="name">{strings.form.name}</Label>
          <Input
            id="name"
            name="name"
            value={values.name}
            onChange={(e) => {
              // Filter out non-English characters in real-time
              const filteredValue = e.target.value.replace(/[^a-zA-Z\s.'-]/g, '')
              setValues((v) => ({ ...v, name: filteredValue }))
            }}
            onBlur={() => setTouched((t) => ({ ...t, name: true }))}
            aria-invalid={!!errors.name && (touched.name || isSubmittedOnce)}
            aria-describedby={errors.name && (touched.name || isSubmittedOnce) ? "name-error" : undefined}
            autoComplete="name"
            placeholder="Enter name in English"
          />
          {(touched.name || isSubmittedOnce) && errors.name && (
            <p id="name-error" className="text-xs text-destructive">
              {errors.name}
            </p>
          )}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="mobile">{strings.form.mobile}</Label>
          <Input
            id="mobile"
            name="mobile"
            inputMode="numeric"
            pattern="[6-9][0-9]{9}"
            maxLength={10}
            value={values.mobile}
            onChange={(e) => setValues((v) => ({ ...v, mobile: e.target.value.replace(/\\D/g, "") }))}
            onBlur={() => setTouched((t) => ({ ...t, mobile: true }))}
            aria-invalid={!!errors.mobile && (touched.mobile || isSubmittedOnce)}
            aria-describedby={errors.mobile && (touched.mobile || isSubmittedOnce) ? "mobile-error" : undefined}
            autoComplete="tel-national"
          />
          {(touched.mobile || isSubmittedOnce) && errors.mobile && (
            <p id="mobile-error" className="text-xs text-destructive">
              {errors.mobile}
            </p>
          )}
        </div>

        <div className="grid gap-2" ref={districtRef}>
          <Label htmlFor="district">{strings.form.district}</Label>
          <div className="relative">
            <button
              type="button"
              role="combobox"
              aria-expanded={districtOpen}
              aria-invalid={!!errors.district && (touched.district || isSubmittedOnce)}
              aria-describedby={errors.district && (touched.district || isSubmittedOnce) ? "district-error" : undefined}
              onClick={() => setDistrictOpen(!districtOpen)}
              className={cn(
                "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",
                !values.district && "text-muted-foreground",
                !!errors.district && (touched.district || isSubmittedOnce) && "border-destructive",
                districtOpen && "ring-2 ring-ring ring-offset-2"
              )}
            >
              <span className="truncate">{values.district || "Select district..."}</span>
              <ChevronsUpDown className={cn("ml-2 h-4 w-4 shrink-0 transition-transform", districtOpen && "rotate-180")} />
            </button>

            {/* Attached dropdown */}
            {districtOpen && (
              <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-popover border border-border rounded-md shadow-lg">
                <Command className="w-full">
                  <CommandInput placeholder="Search districts..." className="h-9" />
                  <CommandList className="max-h-[200px]">
                    <CommandEmpty>No district found.</CommandEmpty>
                    <CommandGroup>
                      {RAJASTHAN_DISTRICTS.map((district) => (
                        <CommandItem
                          key={district}
                          value={district}
                          onSelect={(currentValue) => {
                            setValues((v) => ({
                              ...v,
                              district: currentValue === values.district ? "" : currentValue,
                              constituency: "" // Clear constituency when district changes
                            }))
                            setDistrictOpen(false)
                            setTouched((t) => ({ ...t, district: true, constituency: false }))
                          }}
                          className="cursor-pointer"
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              values.district === district ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {district}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </div>
            )}
          </div>
          {(touched.district || isSubmittedOnce) && errors.district && (
            <p id="district-error" className="text-xs text-destructive">
              {errors.district}
            </p>
          )}
        </div>

        {values.district && (
          <div className="grid gap-2" ref={constituencyRef}>
            <Label htmlFor="constituency">{strings.form.constituency || "Constituency"}</Label>
            <div className="relative">
              <button
                type="button"
                role="combobox"
                aria-expanded={constituencyOpen}
                aria-invalid={!!errors.constituency && (touched.constituency || isSubmittedOnce)}
                aria-describedby={errors.constituency && (touched.constituency || isSubmittedOnce) ? "constituency-error" : undefined}
                onClick={() => setConstituencyOpen(!constituencyOpen)}
                className={cn(
                  "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",
                  !values.constituency && "text-muted-foreground",
                  !!errors.constituency && (touched.constituency || isSubmittedOnce) && "border-destructive",
                  constituencyOpen && "ring-2 ring-ring ring-offset-2"
                )}
              >
                <span className="truncate">{values.constituency || "Select constituency..."}</span>
                <ChevronsUpDown className={cn("ml-2 h-4 w-4 shrink-0 transition-transform", constituencyOpen && "rotate-180")} />
              </button>

              {/* Attached dropdown */}
              {constituencyOpen && (
                <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-popover border border-border rounded-md shadow-lg">
                  <Command className="w-full">
                    <CommandInput placeholder="Search constituencies..." className="h-9" />
                    <CommandList className="max-h-[200px]">
                      <CommandEmpty>No constituency found.</CommandEmpty>
                      <CommandGroup>
                        {DISTRICT_CONSTITUENCIES[values.district]?.map((constituency) => (
                          <CommandItem
                            key={`${constituency.number}-${constituency.name}`}
                            value={`${constituency.number} ${constituency.name}`}
                            onSelect={(currentValue) => {
                              setValues((v) => ({ ...v, constituency: currentValue === values.constituency ? "" : currentValue }))
                              setConstituencyOpen(false)
                              setTouched((t) => ({ ...t, constituency: true }))
                            }}
                            className="cursor-pointer"
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                values.constituency === `${constituency.number} ${constituency.name}` ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {constituency.number} - {constituency.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </div>
              )}
            </div>
            {(touched.constituency || isSubmittedOnce) && errors.constituency && (
              <p id="constituency-error" className="text-xs text-destructive">
                {errors.constituency}
              </p>
            )}
          </div>
        )}

        <div className="grid gap-2">
          <Label htmlFor="village">{strings.form.village}</Label>
          <Input
            id="village"
            name="village"
            value={values.village}
            onChange={(e) => setValues((v) => ({ ...v, village: e.target.value }))}
            onBlur={() => setTouched((t) => ({ ...t, village: true }))}
            aria-invalid={!!errors.village && (touched.village || isSubmittedOnce)}
            aria-describedby={errors.village && (touched.village || isSubmittedOnce) ? "village-error" : undefined}
            autoComplete="address-level1"
          />
          {(touched.village || isSubmittedOnce) && errors.village && (
            <p id="village-error" className="text-xs text-destructive">
              {errors.village}
            </p>
          )}
        </div>

        <div ref={liveRegionRef} aria-live="polite" className="sr-only" />
      </form>
    </section>
  )
}

function getStringsMock() {
  return {
    form: {
      legend: "",
      name: "",
      mobile: "",
      district: "",
      constituency: "",
      village: "",
      continue: "",
      errors: { required: "", mobile: "" },
    },
  }
}
