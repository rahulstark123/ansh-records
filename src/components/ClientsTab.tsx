"use client";

import React, { useState, useMemo, useEffect } from "react";
import dynamic from "next/dynamic";
import { Country, State, City } from "country-state-city";
import { 
  Building2, 
  MapPin, 
  Search, 
  ChevronRight, 
  Users, 
  CheckCircle, 
  XCircle, 
  RotateCcw, 
  SlidersHorizontal,
  Mail,
  PhoneCall,
  ZoomOut,
  Plus,
  X,
  Save,
  Globe2,
  ExternalLink,
  ChevronDown,
  Edit,
  Trash2,
  Calendar
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useApiData } from "@/lib/useApiData";
import { API } from "@/lib/api-cache";
import { ClientsTableSkeleton } from "@/components/skeletons/TabSkeletons";

// Dynamically import LeafletMap with SSR disabled (Leaflet requires 'window')
const LeafletMap = dynamic(() => import("./LeafletMap"), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex flex-col h-full min-h-[380px] rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
      <div className="skeleton-shimmer h-full w-full" />
    </div>
  )
});

interface Client {
  id: string;
  clientId?: string;
  name: string;
  createdAt?: string;
  company: string;
  email?: string | null;
  phone: string;
  pincode: string;
  source: string;
  sourceLink?: string;
  contactMode: string;
  country: string;
  area: string;
  city: string;
  state: string;
  manualAddress?: string | null;
  tier?: "Enterprise" | "Premium" | "Standard";
  status: "Active" | "Inactive";
  notes?: string;
  isConverted?: boolean;
  appsTaken?: string[];
  amountPaid?: number;
  seatsCount?: number;
  conversionNotes?: string;
  convertedAt?: string;
}

const QUICK_COUNTRIES = [
  { code: "IN", name: "India" },
  { code: "US", name: "United States" },
  { code: "GB", name: "United Kingdom" },
  { code: "DE", name: "Germany" },
  { code: "CA", name: "Canada" },
  { code: "AU", name: "Australia" }
];

function mapApiClient(c: any): Client {
  return {
    id: c.id,
    clientId: c.clientId,
    name: c.name,
    company: c.company,
    email: c.email || undefined,
    phone: c.phone,
    pincode: c.pincode,
    source: c.source,
    sourceLink: c.sourceLink || undefined,
    contactMode: c.contactMode,
    country: c.country,
    state: c.state,
    city: c.city,
    area: c.area,
    manualAddress: c.manualAddress || undefined,
    status: c.status,
    notes: c.notes || undefined,
    isConverted: !!c.isConverted,
    appsTaken: c.appsTaken || [],
    amountPaid: c.amountPaid || 0,
    seatsCount: c.seatsCount || 1,
    conversionNotes: c.conversionNotes || undefined,
    convertedAt: c.convertedAt || undefined
  };
}

function mapApiClients(raw: unknown): Client[] {
  return (raw as any[]).map(mapApiClient);
}

export default function ClientsTab() {
  const [selectedCountry, setSelectedCountry] = useState("IN");
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [selectedArea, setSelectedArea] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Reactive data states to allow adding new entries in real time
  const { data, isLoading, mutate: mutateClients } = useApiData<Client[]>(
    API.clients,
    API.clients,
    { transform: mapApiClients }
  );
  const clients = data ?? [];
  const [customAreas, setCustomAreas] = useState<Record<string, Array<{ id: string; name: string; lat: number; lng: number; density: "High" | "Medium" | "Low"; clientCount: number }>>>({});

  // Form registration date state
  const [formDate, setFormDate] = useState(new Date().toISOString().split("T")[0]);

  // Pagination states
  const [clientCurrentPage, setClientCurrentPage] = useState(1);
  const [clientsPerPage, setClientsPerPage] = useState(10);

  // Drawer / Modal control states
  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Form Fields State
  const [formName, setFormName] = useState("");
  const [formCompany, setFormCompany] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formPincode, setFormPincode] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formManualAddress, setFormManualAddress] = useState("");
  const [formSource, setFormSource] = useState("LinkedIn");
  const [formSourceLink, setFormSourceLink] = useState("");
  const [formContactMode, setFormContactMode] = useState("Call");

  // Form Geography Selections
  const [formCountry, setFormCountry] = useState("IN");
  const [formState, setFormState] = useState("");
  const [formCity, setFormCity] = useState("");
  const [formArea, setFormArea] = useState("");
  const [formError, setFormError] = useState("");
  const [isAutofilling, setIsAutofilling] = useState(false);
  const [formNotes, setFormNotes] = useState("");
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionIndex, setMentionIndex] = useState(-1);
  const [selectedMentionIdx, setSelectedMentionIdx] = useState(0);

  // New states for editing and conversion tabs
  const [activeTableTab, setActiveTableTab] = useState<"leads" | "converted">("leads");
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  // Reset pagination page on search, filter, or page size update
  useEffect(() => {
    setClientCurrentPage(1);
  }, [searchQuery, selectedState, selectedCity, selectedArea, activeTableTab, clientsPerPage]);

  // Conversion Form states
  const [showConversionModal, setShowConversionModal] = useState(false);
  const [convertingClient, setConvertingClient] = useState<Client | null>(null);
  const [conversionApps, setConversionApps] = useState<string[]>([]);
  const [conversionAmount, setConversionAmount] = useState("");
  const [conversionSeats, setConversionSeats] = useState("");
  const [conversionNotes, setConversionNotes] = useState("");

  const AVAILABLE_APPS = useMemo(() => ["Ansh Records", "Ansh CRM", "Ansh Billing", "Ansh Logistics", "Ansh Finance"], []);

  const handleEditClick = (client: Client) => {
    setEditingClient(client);
    setFormName(client.name);
    setFormCompany(client.company);
    setFormPhone(client.phone);
    setFormEmail(client.email || "");
    setFormPincode(client.pincode);
    setFormManualAddress(client.manualAddress || "");
    setFormSource(client.source);
    setFormSourceLink(client.sourceLink || "");
    setFormContactMode(client.contactMode);
    setFormCountry(client.country);
    setFormState(client.state);
    setFormCity(client.city);
    setFormArea(client.area);
    setFormNotes(client.notes || "");
    if (client.createdAt) {
      setFormDate(new Date(client.createdAt).toISOString().split("T")[0]);
    } else {
      setFormDate(new Date().toISOString().split("T")[0]);
    }
    setIsAddDrawerOpen(true);
  };

  // Custom Delete Modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingClient, setDeletingClient] = useState<Client | null>(null);
  const [deleteConfirmName, setDeleteConfirmName] = useState("");

  // Details Drawer states
  const [showDetailsDrawer, setShowDetailsDrawer] = useState(false);
  const [detailedClient, setDetailedClient] = useState<Client | null>(null);

  const handleDeleteClick = (client: Client) => {
    setDeletingClient(client);
    setDeleteConfirmName("");
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deletingClient) return;

    try {
      const res = await fetch(`/api/clients?id=${deletingClient.id}`, {
        method: "DELETE"
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to delete client");
      }

      mutateClients((prev) => (prev ?? []).filter((c) => c.id !== deletingClient.id));
      setSuccessToast(`Successfully deleted client ${deletingClient.name}!`);
    } catch (err: any) {
      alert(err.message || "An error occurred while deleting the client.");
    } finally {
      setShowDeleteModal(false);
      setDeletingClient(null);
      setDeleteConfirmName("");
      setTimeout(() => setSuccessToast(null), 3000);
    }
  };

  const handleSaveConversion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!convertingClient) return;

    try {
      const dateStr = new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric"
      });

      const res = await fetch("/api/clients", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: convertingClient.id,
          isConverted: true,
          appsTaken: conversionApps,
          amountPaid: parseFloat(conversionAmount) || 0,
          seatsCount: parseInt(conversionSeats) || 1,
          conversionNotes: conversionNotes,
          convertedAt: dateStr
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to convert client");
      }

      const updated = await res.json();
      mutateClients((prev) =>
        (prev ?? []).map((c) =>
          c.id === updated.id
            ? {
                ...c,
                isConverted: true,
                appsTaken: updated.appsTaken,
                amountPaid: updated.amountPaid,
                seatsCount: updated.seatsCount,
                conversionNotes: updated.conversionNotes || undefined,
                convertedAt: updated.convertedAt || undefined
              }
            : c
        )
      );

      setSuccessToast("Client marked as Converted successfully!");
    } catch (err: any) {
      alert(err.message || "An error occurred while saving conversion details.");
    } finally {
      setShowConversionModal(false);
      setConvertingClient(null);
      setConversionApps([]);
      setConversionAmount("");
      setConversionSeats("");
      setConversionNotes("");
      setTimeout(() => setSuccessToast(null), 3000);
    }
  };

  const handleCloseDrawer = () => {
    setIsAddDrawerOpen(false);
    setEditingClient(null);
    setFormName("");
    setFormCompany("");
    setFormPhone("");
    setFormPincode("");
    setFormEmail("");
    setFormManualAddress("");
    setFormSource("LinkedIn");
    setFormSourceLink("");
    setFormContactMode("Call");
    setFormNotes("");
    setFormDate(new Date().toISOString().split("T")[0]);
  };

  const MENTIONABLE_USERS = useMemo(() => [
    { id: "AnshAdmin", name: "Ansh Admin", role: "Administrator" },
    { id: "SystemScheduler", name: "System Scheduler", role: "Automation Bot" },
    { id: "PartnerPortal", name: "Partner Portal", role: "API Integration" },
    { id: "SalesRep", name: "Sales Representative", role: "Agent" },
    { id: "AccountManager", name: "Account Manager", role: "Manager" }
  ], []);

  const filteredMentions = useMemo(() => {
    return MENTIONABLE_USERS.filter(user => 
      user.id.toLowerCase().includes(mentionQuery.toLowerCase()) ||
      user.name.toLowerCase().includes(mentionQuery.toLowerCase())
    );
  }, [mentionQuery, MENTIONABLE_USERS]);

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setFormNotes(value);

    const selectionStart = e.target.selectionStart;
    const textBeforeCursor = value.substring(0, selectionStart);
    
    const lastAtIdx = textBeforeCursor.lastIndexOf("@");
    if (lastAtIdx !== -1 && lastAtIdx >= textBeforeCursor.lastIndexOf(" ")) {
      const query = textBeforeCursor.substring(lastAtIdx + 1);
      setShowMentionDropdown(true);
      setMentionQuery(query);
      setMentionIndex(lastAtIdx);
      setSelectedMentionIdx(0);
    } else {
      setShowMentionDropdown(false);
    }
  };

  const handleMentionSelect = (userId: string) => {
    if (mentionIndex === -1) return;
    const beforeAt = formNotes.substring(0, mentionIndex);
    const afterCursor = formNotes.substring(mentionIndex + mentionQuery.length + 1);
    
    const newText = `${beforeAt}@${userId} ${afterCursor}`;
    setFormNotes(newText);
    setShowMentionDropdown(false);
  };

  const handleNotesKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showMentionDropdown && filteredMentions.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedMentionIdx(prev => (prev + 1) % filteredMentions.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedMentionIdx(prev => (prev - 1 + filteredMentions.length) % filteredMentions.length);
      } else if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        handleMentionSelect(filteredMentions[selectedMentionIdx].id);
      } else if (e.key === "Escape") {
        e.preventDefault();
        setShowMentionDropdown(false);
      }
    }
  };

  const renderNotesWithMentions = (notesText: string) => {
    if (!notesText) return null;
    const parts = notesText.split(/(\s+)/);
    return parts.map((part, idx) => {
      if (part.startsWith("@")) {
        const username = part.substring(1).replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"");
        const matched = MENTIONABLE_USERS.some(u => u.id.toLowerCase() === username.toLowerCase());
        if (matched) {
          return (
            <span 
              key={idx} 
              className="text-primary font-bold bg-primary/10 dark:bg-primary/20 px-1.5 py-0.5 rounded text-[9px] not-italic inline-block align-middle mx-0.5"
            >
              @{username}
            </span>
          );
        }
      }
      return <span key={idx}>{part}</span>;
    });
  };

  const handlePincodeLookup = async (pincode: string) => {
    if (!pincode || pincode.trim().length < 3) return;
    setIsAutofilling(true);
    setFormError("");

    try {
      if (/^\d{6}$/.test(pincode.trim())) {
        const res = await fetch(`https://api.postalpincode.in/pincode/${pincode.trim()}`);
        if (res.ok) {
          const data = await res.json();
          if (data && data[0] && data[0].Status === "Success" && data[0].PostOffice && data[0].PostOffice.length > 0) {
            const firstOffice = data[0].PostOffice[0];
            const stateName = firstOffice.State;
            const cityName = firstOffice.District;
            const areaName = firstOffice.Name;

            const countryStates = State.getStatesOfCountry("IN");
            const matchedState = countryStates.find(
              (s) => s.name.toLowerCase() === stateName.toLowerCase()
            );

            setFormCountry("IN");
            setSelectedCountry("IN");

            if (matchedState) {
              setFormState(matchedState.isoCode);
              setSelectedState(matchedState.isoCode);

              const stateCities = City.getCitiesOfState("IN", matchedState.isoCode);
              const matchedCity = stateCities.find(
                (c) => c.name.toLowerCase() === cityName.toLowerCase()
              );

              const finalCityName = matchedCity ? matchedCity.name : cityName;
              setFormCity(finalCityName);
              setSelectedCity(finalCityName);

              const cityLat = matchedCity ? parseFloat(matchedCity.latitude || "0") || 0 : 20.5937;
              const cityLng = matchedCity ? parseFloat(matchedCity.longitude || "0") || 0 : 78.9629;

              const newCustomArea = {
                id: areaName,
                name: areaName,
                lat: cityLat,
                lng: cityLng,
                density: "Medium" as const,
                clientCount: 0
              };

              setCustomAreas((prev) => {
                const list = prev[finalCityName] || [];
                if (!list.some((a) => a.id === areaName)) {
                  return { ...prev, [finalCityName]: [...list, newCustomArea] };
                }
                return prev;
              });

              setFormArea(areaName);
              setSelectedArea(areaName);
            }
            setIsAutofilling(false);
            return;
          }
        }
      }

      const cleanPincode = pincode.trim().replace(/\s+/g, "");
      const zippoCountries = ["US", "CA", "DE", "GB", "AU"];
      let zippoMatched = false;

      const searchCountries = zippoCountries.includes(formCountry)
        ? [formCountry, ...zippoCountries.filter((c) => c !== formCountry)]
        : zippoCountries;

      for (const country of searchCountries) {
        try {
          const zippoRes = await fetch(`https://api.zippopotam.us/${country.toLowerCase()}/${cleanPincode}`);
          if (zippoRes.ok) {
            const zippoData = await zippoRes.json();
            if (zippoData && zippoData.places && zippoData.places.length > 0) {
              const place = zippoData.places[0];
              const stateName = place.state;
              const cityName = place["place name"];
              const placeLat = parseFloat(place.latitude) || 0;
              const placeLng = parseFloat(place.longitude) || 0;
              
              setFormCountry(country);
              setSelectedCountry(country);

              const countryStates = State.getStatesOfCountry(country);
              const matchedState = countryStates.find(
                (s) => s.name.toLowerCase() === stateName.toLowerCase() || 
                       s.isoCode.toLowerCase() === (place["state abbreviation"] || "").toLowerCase()
              );

              if (matchedState) {
                setFormState(matchedState.isoCode);
                setSelectedState(matchedState.isoCode);

                const stateCities = City.getCitiesOfState(country, matchedState.isoCode);
                const matchedCity = stateCities.find(
                  (c) => c.name.toLowerCase() === cityName.toLowerCase()
                );

                const finalCityName = matchedCity ? matchedCity.name : cityName;
                setFormCity(finalCityName);
                setSelectedCity(finalCityName);

                const areaName = `${finalCityName} Central`;
                const newCustomArea = {
                  id: areaName,
                  name: areaName,
                  lat: placeLat,
                  lng: placeLng,
                  density: "Medium" as const,
                  clientCount: 0
                };

                setCustomAreas((prev) => {
                  const list = prev[finalCityName] || [];
                  if (!list.some((a) => a.id === areaName)) {
                    return { ...prev, [finalCityName]: [...list, newCustomArea] };
                  }
                  return prev;
                });

                setFormArea(areaName);
                setSelectedArea(areaName);
              }
              zippoMatched = true;
              break;
            }
          }
        } catch (err) {}
      }

      if (zippoMatched) {
        setIsAutofilling(false);
        return;
      }

      const countryFilter = formCountry ? `&countrycodes=${formCountry.toLowerCase()}` : "";
      const nominatimRes = await fetch(
        `https://nominatim.openstreetmap.org/search?postalcode=${encodeURIComponent(
          pincode.trim()
        )}${countryFilter}&format=json&addressdetails=1`,
        { headers: { "User-Agent": "AnshRecordsApp/1.0" } }
      );

      if (nominatimRes.ok) {
        const nominatimData = await nominatimRes.json();
        if (nominatimData && nominatimData.length > 0) {
          const address = nominatimData[0].address;
          const countryCode = (address.country_code || "").toUpperCase();
          const stateName = address.state || address.region || address.county;
          const cityName = address.city || address.town || address.municipality || address.village;
          const nominatimLat = parseFloat(nominatimData[0].lat) || 0;
          const nominatimLng = parseFloat(nominatimData[0].lon) || 0;
          
          if (countryCode) {
            setFormCountry(countryCode);
            setSelectedCountry(countryCode);

            if (stateName) {
              const countryStates = State.getStatesOfCountry(countryCode);
              const matchedState = countryStates.find(
                (s) => s.name.toLowerCase() === stateName.toLowerCase()
              );

              if (matchedState) {
                setFormState(matchedState.isoCode);
                setSelectedState(matchedState.isoCode);

                if (cityName) {
                  const stateCities = City.getCitiesOfState(countryCode, matchedState.isoCode);
                  const matchedCity = stateCities.find(
                    (c) => c.name.toLowerCase() === cityName.toLowerCase()
                  );

                  const finalCityName = matchedCity ? matchedCity.name : cityName;
                  setFormCity(finalCityName);
                  setSelectedCity(finalCityName);

                  const areaName = address.suburb || address.neighbourhood || address.quarter || `${finalCityName} Central`;
                  
                  const newCustomArea = {
                    id: areaName,
                    name: areaName,
                    lat: nominatimLat,
                    lng: nominatimLng,
                    density: "Medium" as const,
                    clientCount: 0
                  };

                  setCustomAreas((prev) => {
                    const list = prev[finalCityName] || [];
                    if (!list.some((a) => a.id === areaName)) {
                      return { ...prev, [finalCityName]: [...list, newCustomArea] };
                    }
                    return prev;
                  });

                  setFormArea(areaName);
                  setSelectedArea(areaName);
                }
              }
            }
          }
        }
      }
    } catch (error) {
      console.error("Autofill Pincode error:", error);
    } finally {
      setIsAutofilling(false);
    }
  };

  const allCountries = useMemo(() => Country.getAllCountries(), []);

  const handleFormCountryChange = (countryCode: string) => {
    setFormCountry(countryCode);
    setFormState("");
    setFormCity("");
    setFormArea("");
    setSelectedCountry(countryCode);
    setSelectedState(null);
    setSelectedCity(null);
    setSelectedArea(null);
  };

  const handleFormStateChange = (stateId: string) => {
    setFormState(stateId);
    setFormCity("");
    setFormArea("");
    setSelectedState(stateId || null);
    setSelectedCity(null);
    setSelectedArea(null);
  };

  const handleFormCityChange = (cityId: string) => {
    setFormCity(cityId);
    setFormArea("");
    setSelectedCity(cityId || null);
    setSelectedArea(null);
  };

  const handleFormAreaChange = (areaId: string) => {
    setFormArea(areaId);
    setSelectedArea(areaId || null);
  };

  const handleCountryChange = (countryCode: string) => {
    setSelectedCountry(countryCode);
    setSelectedState(null);
    setSelectedCity(null);
    setSelectedArea(null);
    setSearchQuery("");
  };

  const handleSelectState = (stateId: string) => {
    setSelectedState(stateId || null);
    setSelectedCity(null);
    setSelectedArea(null);
  };

  const handleSelectCity = (cityId: string) => {
    setSelectedCity(cityId || null);
    setSelectedArea(null);
  };

  const handleSelectArea = (areaId: string) => {
    setSelectedArea(areaId || null);
  };

  const resetAll = () => {
    setSelectedState(null);
    setSelectedCity(null);
    setSelectedArea(null);
    setSearchQuery("");
  };

  const statesList = useMemo(() => {
    return State.getStatesOfCountry(selectedCountry).map((s) => ({
      id: s.isoCode,
      name: s.name,
      lat: parseFloat(s.latitude || "0") || 0,
      lng: parseFloat(s.longitude || "0") || 0,
      clientCount: clients.filter((c) => c.country === selectedCountry && c.state === s.isoCode).length
    }));
  }, [selectedCountry, clients]);
  
  const citiesList = useMemo(() => {
    if (!selectedState) return [];
    return City.getCitiesOfState(selectedCountry, selectedState).map((c) => ({
      id: c.name,
      name: c.name,
      lat: parseFloat(c.latitude || "0") || 0,
      lng: parseFloat(c.longitude || "0") || 0,
      clientCount: clients.filter(
        (cl) => cl.country === selectedCountry && cl.state === selectedState && cl.city === c.name
      ).length
    }));
  }, [selectedCountry, selectedState, clients]);

  const areasList = useMemo(() => {
    if (!selectedState || !selectedCity) return [];
    const allCities = City.getCitiesOfState(selectedCountry, selectedState);
    const currentCityNode = allCities.find((c) => c.name === selectedCity);
    const cityLat = currentCityNode ? parseFloat(currentCityNode.latitude || "0") || 0 : 0;
    const cityLng = currentCityNode ? parseFloat(currentCityNode.longitude || "0") || 0 : 0;

    const base = [
      { id: `${selectedCity} Central`, name: `${selectedCity} Central`, lat: cityLat, lng: cityLng, density: "High" as const },
      { id: `${selectedCity} North`, name: `${selectedCity} North`, lat: cityLat + 0.015, lng: cityLng + 0.015, density: "Medium" as const },
      { id: `${selectedCity} South`, name: `${selectedCity} South`, lat: cityLat - 0.015, lng: cityLng - 0.015, density: "Medium" as const },
      { id: `${selectedCity} West`, name: `${selectedCity} West`, lat: cityLat - 0.015, lng: cityLng + 0.015, density: "Low" as const }
    ];

    const custom = customAreas[selectedCity] || [];
    const combined = [...base];

    custom.forEach((c) => {
      if (!combined.some((b) => b.id === c.id)) {
        combined.push(c);
      }
    });

    return combined.map((area) => ({
      ...area,
      clientCount: clients.filter((c) => c.country === selectedCountry && c.state === selectedState && c.city === selectedCity && c.area === area.name).length
    }));
  }, [selectedCountry, selectedState, selectedCity, clients, customAreas]);

  const filteredClients = useMemo(() => {
    return clients.filter((client) => {
      const wantsConverted = activeTableTab === "converted";
      const isClientConverted = !!client.isConverted;
      if (wantsConverted !== isClientConverted) return false;

      if (client.country !== selectedCountry) return false;
      if (selectedState && client.state !== selectedState) return false;
      if (selectedCity && client.city !== selectedCity) return false;
      if (selectedArea && client.area !== selectedArea) return false;

      if (searchQuery.trim() !== "") {
        const query = searchQuery.toLowerCase();
        return (
          client.name.toLowerCase().includes(query) ||
          client.company.toLowerCase().includes(query) ||
          client.email?.toLowerCase().includes(query)
        );
      }

      return true;
    });
  }, [clients, selectedCountry, selectedState, selectedCity, selectedArea, searchQuery, activeTableTab]);

  const formStatesList = useMemo(() => State.getStatesOfCountry(formCountry), [formCountry]);
  
  const formCitiesList = useMemo(() => {
    if (!formState) return [];
    return City.getCitiesOfState(formCountry, formState);
  }, [formCountry, formState]);

  const formAreasList = useMemo(() => {
    if (!formState || !formCity) return [];
    const allCities = City.getCitiesOfState(formCountry, formState);
    const currentCityNode = allCities.find((c) => c.name === formCity);
    const cityLat = currentCityNode ? parseFloat(currentCityNode.latitude || "0") || 0 : 0;
    const cityLng = currentCityNode ? parseFloat(currentCityNode.longitude || "0") || 0 : 0;

    const base = [
      { id: `${formCity} Central`, name: `${formCity} Central` },
      { id: `${formCity} North`, name: `${formCity} North` },
      { id: `${formCity} South`, name: `${formCity} South` },
      { id: `${formCity} West`, name: `${formCity} West` }
    ];

    const custom = customAreas[formCity] || [];
    const combined = [...base];

    custom.forEach((c) => {
      if (!combined.some((b) => b.id === c.id)) {
        combined.push({ id: c.id, name: c.name });
      }
    });

    return combined;
  }, [formCountry, formState, formCity, customAreas]);

  const handleAddClientSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!formName || !formCompany || !formPhone || !formState || !formCity || !formArea || !formPincode) {
      setFormError("Please fill in all mandatory fields.");
      return;
    }

    if (formEmail.trim() && !/\S+@\S+\.\S+/.test(formEmail.trim())) {
      setFormError("Please enter a valid email address.");
      return;
    }

    try {
      if (editingClient) {
        const res = await fetch("/api/clients", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingClient.id,
            name: formName,
            company: formCompany,
            email: formEmail.trim() || undefined,
            phone: formPhone,
            pincode: formPincode,
            source: formSource,
            sourceLink: formSourceLink || undefined,
            contactMode: formContactMode,
            country: formCountry,
            state: formState,
            city: formCity,
            area: formArea,
            manualAddress: formManualAddress.trim() || undefined,
            notes: formNotes || undefined,
            date: formDate
          })
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || "Failed to update client");
        }

        const updated = await res.json();
        mutateClients((prev) =>
          (prev ?? []).map((c) => (c.id === updated.id ? {
            ...c,
            name: updated.name,
            company: updated.company,
            email: updated.email || undefined,
            phone: updated.phone,
            pincode: updated.pincode,
            source: updated.source,
            sourceLink: updated.sourceLink || undefined,
            contactMode: updated.contactMode,
            country: updated.country,
            state: updated.state,
            city: updated.city,
            area: updated.area,
            manualAddress: updated.manualAddress || undefined,
            notes: updated.notes || undefined,
            createdAt: updated.createdAt
          } : c))
        );
        setSuccessToast("Client updated successfully!");
        setEditingClient(null);
      } else {
        const res = await fetch("/api/clients", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formName,
            company: formCompany,
            email: formEmail.trim() || undefined,
            phone: formPhone,
            pincode: formPincode,
            source: formSource,
            sourceLink: formSourceLink || undefined,
            contactMode: formContactMode,
            country: formCountry,
            state: formState,
            city: formCity,
            area: formArea,
            manualAddress: formManualAddress.trim() || undefined,
            notes: formNotes || undefined,
            date: formDate
          })
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || "Failed to register client");
        }

        const created = await res.json();
        const mappedCreated: Client = {
          id: created.id,
          clientId: created.clientId,
          name: created.name,
          company: created.company,
          email: created.email || undefined,
          phone: created.phone,
          pincode: created.pincode,
          source: created.source,
          sourceLink: created.sourceLink || undefined,
          contactMode: created.contactMode,
          country: created.country,
          area: created.area,
          city: created.city,
          state: created.state,
          manualAddress: created.manualAddress || undefined,
          status: created.status,
          notes: created.notes || undefined,
          isConverted: !!created.isConverted,
          appsTaken: created.appsTaken || [],
          amountPaid: created.amountPaid || 0,
          seatsCount: created.seatsCount || 1,
          conversionNotes: created.conversionNotes || undefined,
          convertedAt: created.convertedAt || undefined,
          createdAt: created.createdAt
        };

        mutateClients((prev) => [mappedCreated, ...(prev ?? [])]);
        setSuccessToast("Client registered successfully!");
      }

      setFormName("");
      setFormCompany("");
      setFormPhone("");
      setFormPincode("");
      setFormEmail("");
      setFormManualAddress("");
      setFormSource("LinkedIn");
      setFormSourceLink("");
      setFormContactMode("Call");
      setFormNotes("");
      setIsAddDrawerOpen(false);

      setTimeout(() => setSuccessToast(null), 3000);
    } catch (err: any) {
      setFormError(err.message || "An error occurred while saving the client.");
    }
  };

  const mapCenterAndZoom = useMemo(() => {
    if (selectedCity && selectedArea) {
      const areaNode = areasList.find((a) => a.id === selectedArea);
      if (areaNode) return { center: [areaNode.lat, areaNode.lng] as [number, number], zoom: 13 };
    }
    if (selectedState && selectedCity) {
      const cityNode = citiesList.find((c) => c.id === selectedCity);
      if (cityNode) return { center: [cityNode.lat, cityNode.lng] as [number, number], zoom: 11 };
    }
    if (selectedState) {
      const stateNode = statesList.find((s) => s.id === selectedState);
      if (stateNode) return { center: [stateNode.lat, stateNode.lng] as [number, number], zoom: 7 };
    }
    const countryNode = allCountries.find((c) => c.isoCode === selectedCountry);
    const countryLat = countryNode ? parseFloat(countryNode.latitude || "0") || 20.5937 : 20.5937;
    const countryLng = countryNode ? parseFloat(countryNode.longitude || "0") || 78.9629 : 78.9629;
    
    let zoomLevel = 5;
    if (selectedCountry === "US" || selectedCountry === "CA" || selectedCountry === "RU" || selectedCountry === "CN" || selectedCountry === "AU") {
      zoomLevel = 4;
    } else if (selectedCountry === "DE" || selectedCountry === "GB" || selectedCountry === "FR") {
      zoomLevel = 6;
    }

    return {
      center: [countryLat, countryLng] as [number, number],
      zoom: zoomLevel
    };
  }, [selectedCountry, selectedState, selectedCity, selectedArea, statesList, citiesList, areasList, allCountries]);

  const mapMarkers = useMemo(() => {
    if (selectedCity && areasList.length > 0) {
      return areasList
        .filter((a) => (a.lat !== 0 || a.lng !== 0) && a.clientCount > 0)
        .map((area) => ({
          id: area.id,
          name: area.name,
          lat: area.lat,
          lng: area.lng,
          count: area.clientCount,
          density: area.density
        }));
    }
    if (selectedState && citiesList.length > 0) {
      return citiesList
        .filter((c) => (c.lat !== 0 || c.lng !== 0) && c.clientCount > 0)
        .map((city) => ({
          id: city.id,
          name: city.name,
          lat: city.lat,
          lng: city.lng,
          count: city.clientCount
        }));
    }
    if (statesList.length > 0) {
      return statesList
        .filter((s) => (s.lat !== 0 || s.lng !== 0) && s.clientCount > 0)
        .map((state) => ({
          id: state.id,
          name: state.name,
          lat: state.lat,
          lng: state.lng,
          count: state.clientCount
        }));
    }
    return [];
  }, [selectedCity, selectedState, statesList, citiesList, areasList]);

  const handleMapMarkerClick = (markerId: string) => {
    if (!selectedState) {
      handleSelectState(markerId);
    } else if (!selectedCity) {
      handleSelectCity(markerId);
    } else {
      handleSelectArea(markerId);
    }
  };

  return (
    <div className="space-y-6 h-full flex flex-col relative">
      <AnimatePresence>
        {successToast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="absolute top-2 left-1/2 -translate-x-1/2 z-50 bg-success border border-success-soft text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 text-xs font-bold"
          >
            <CheckCircle className="w-5 h-5 shrink-0" />
            <span>{successToast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex justify-between items-center bg-white/50 dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-200/50 dark:border-slate-800/50">
        <div className="flex items-center gap-3 overflow-x-auto select-none max-w-[70%]">
          <SlidersHorizontal className="w-4 h-4 text-slate-400 shrink-0" />
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 mr-2 shrink-0">
            Country:
          </span>
          <div className="flex gap-2">
            {QUICK_COUNTRIES.map((country) => (
              <button
                key={country.code}
                onClick={() => handleCountryChange(country.code)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border cursor-pointer hover:scale-102 shrink-0 ${
                  selectedCountry === country.code
                    ? "bg-primary text-white border-primary shadow-sm"
                    : "bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                }`}
              >
                {country.name}
              </button>
            ))}
          </div>

          <div className="relative shrink-0 border-l border-slate-200 dark:border-slate-800 pl-3 flex items-center gap-1.5">
            <span className="text-[10px] font-semibold text-slate-400">All:</span>
            <select
              value={selectedCountry}
              onChange={(e) => handleCountryChange(e.target.value)}
              className="bg-white dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 rounded-lg pl-2.5 pr-8 py-1.5 text-xs font-bold outline-none cursor-pointer focus:border-primary appearance-none max-w-[130px] overflow-hidden text-ellipsis"
            >
              {allCountries.map((c) => (
                <option key={c.isoCode} value={c.isoCode}>
                  {c.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 absolute right-2 top-2.5 text-slate-400 pointer-events-none" />
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 ml-4">
          <button
            onClick={() => setIsAddDrawerOpen(true)}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl shadow-md shadow-primary/20 cursor-pointer transition hover:scale-102 hover:shadow-primary/30"
          >
            <Plus className="w-4 h-4" />
            <span>Add Client</span>
          </button>

          {(selectedState || selectedCity || selectedArea) && (
            <button
              onClick={resetAll}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch flex-1">
        <div className="lg:col-span-5 flex flex-col glass-panel rounded-2xl p-6 relative overflow-hidden">
          <AnimatePresence mode="wait">
            {!selectedState && (
              <motion.div
                key="states-view"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-4 flex-1 flex flex-col"
              >
                <div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-primary" />
                    Select a State / Territory
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Viewing states in {allCountries.find((c) => c.isoCode === selectedCountry)?.name}.
                  </p>
                </div>

                <div className="space-y-2 overflow-y-auto max-h-[320px] flex-1">
                  {statesList.length > 0 ? (
                    statesList.map((state) => (
                      <button
                        key={state.id}
                        onClick={() => handleSelectState(state.id)}
                        className="w-full flex items-center justify-between p-3.5 rounded-xl border border-slate-200/60 dark:border-slate-800/80 bg-white/40 dark:bg-slate-950/20 hover:bg-slate-50 dark:hover:bg-slate-900/40 hover:border-primary/20 dark:hover:border-primary/30 transition text-left cursor-pointer group"
                      >
                        <div>
                          <span className="font-semibold text-slate-700 dark:text-slate-200 text-xs">
                            {state.name}
                          </span>
                          <span className="block text-[10px] text-slate-400 mt-0.5">
                            Region Registry
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-primary px-2.5 py-0.5 rounded-full bg-primary/10">
                            {state.clientCount.toLocaleString()} clients
                          </span>
                          <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-primary transition-colors" />
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="text-center py-12 text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                      No states found in this country dataset. Click 'Add Client' to register one!
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {selectedState && !selectedCity && (
              <motion.div
                key="cities-view"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-4 flex-1 flex flex-col"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-primary" />
                      Select a City / District
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Showing cities in <strong className="text-slate-700 dark:text-slate-300">{State.getStateByCodeAndCountry(selectedState, selectedCountry)?.name || selectedState}</strong>.
                    </p>
                  </div>
                  <button
                    onClick={() => handleSelectState("")}
                    className="text-[10px] text-primary font-semibold hover:underline"
                  >
                    Back to States
                  </button>
                </div>

                <div className="space-y-2 overflow-y-auto max-h-[320px] flex-1">
                  {citiesList.length > 0 ? (
                    citiesList.map((city) => (
                      <button
                        key={city.id}
                        onClick={() => handleSelectCity(city.id)}
                        className="w-full flex items-center justify-between p-3.5 rounded-xl border border-slate-200/60 dark:border-slate-800/80 bg-white/40 dark:bg-slate-950/20 hover:bg-slate-50 dark:hover:bg-slate-900/40 hover:border-primary/20 dark:hover:border-primary/30 transition text-left cursor-pointer group"
                      >
                        <div>
                          <span className="font-semibold text-slate-700 dark:text-slate-200 text-xs">
                            {city.name}
                          </span>
                          <span className="block text-[10px] text-slate-400 mt-0.5">
                            City Municipality
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-primary px-2.5 py-0.5 rounded-full bg-primary/10">
                            {city.clientCount.toLocaleString()} clients
                          </span>
                          <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-primary transition-colors" />
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="text-center py-12 text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                      No cities found in this state dataset. Click 'Add Client' to register one!
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {selectedState && selectedCity && (
              <motion.div
                key="areas-view"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-4 flex-1 flex flex-col"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-primary" />
                      Client Sectors
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Geographic neighborhood nodes in <strong className="text-slate-700 dark:text-slate-300">{selectedCity}</strong>.
                    </p>
                  </div>
                  <button
                    onClick={() => handleSelectCity("")}
                    className="text-[10px] text-primary font-semibold hover:underline"
                  >
                    Back to Cities
                  </button>
                </div>

                <div className="space-y-2 overflow-y-auto max-h-[320px] flex-1">
                  {areasList.length > 0 ? (
                    areasList.map((area) => {
                      const isSelected = selectedArea === area.id;
                      const densityColor = area.density === "High" ? "text-danger bg-danger/10" : 
                                           area.density === "Medium" ? "text-success bg-success/10" : 
                                           "text-warning bg-warning/10";
                      return (
                        <button
                          key={area.id}
                          onClick={() => handleSelectArea(area.id)}
                          className={`w-full flex items-center justify-between p-3.5 rounded-xl border transition text-left cursor-pointer group ${
                            isSelected 
                              ? "border-primary bg-primary/5 shadow-sm"
                              : "border-slate-200/60 dark:border-slate-800/80 bg-white/40 dark:bg-slate-950/20 hover:bg-slate-50 dark:hover:bg-slate-900/40 hover:border-primary/20 dark:hover:border-primary/30"
                          }`}
                        >
                          <div>
                            <span className="font-semibold text-slate-700 dark:text-slate-200 text-xs">
                              {area.name}
                            </span>
                            <div className="flex items-center gap-1.5 mt-1">
                              <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded-full ${densityColor}`}>
                                {area.density} density
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-600 dark:text-slate-400 px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg">
                              {area.clientCount.toLocaleString()}
                            </span>
                            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-primary transition-colors" />
                          </div>
                        </button>
                      );
                    })
                  ) : (
                    <div className="text-center py-10 text-xs text-slate-400">
                      No areas available for this city. Select a city or add a client to populate areas.
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="lg:col-span-7 flex flex-col h-full relative">
          <LeafletMap
            center={mapCenterAndZoom.center}
            zoom={mapCenterAndZoom.zoom}
            markers={mapMarkers}
            onMarkerClick={handleMapMarkerClick}
            selectedId={selectedArea || selectedCity || selectedState}
          />
          
          <div className="mt-3 flex items-center justify-between text-[11px] bg-white/60 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800/60 rounded-xl px-4 py-2.5">
            <div className="flex items-center gap-1.5 text-slate-400 font-semibold">
              <span>Map Focus</span>
              <span className="text-slate-300 dark:text-slate-700">&gt;</span>
              <span className="text-slate-600 dark:text-slate-300 font-bold">{selectedCountry}</span>
              {selectedState && (
                <>
                  <span className="text-slate-300 dark:text-slate-700">&gt;</span>
                  <span className="text-slate-600 dark:text-slate-300 font-bold">{selectedState}</span>
                </>
              )}
              {selectedCity && (
                <>
                  <span className="text-slate-300 dark:text-slate-700">&gt;</span>
                  <span className="text-slate-600 dark:text-slate-300 font-bold">{selectedCity}</span>
                </>
              )}
              {selectedArea && (
                <>
                  <span className="text-slate-300 dark:text-slate-700">&gt;</span>
                  <span className="text-primary font-bold">{selectedArea}</span>
                </>
              )}
            </div>

            {selectedState && (
              <button
                onClick={() => {
                  if (selectedArea) {
                    setSelectedArea(null);
                  } else if (selectedCity) {
                    setSelectedCity(null);
                  } else if (selectedState) {
                    setSelectedState(null);
                  }
                }}
                className="text-[10px] font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
              >
                <ZoomOut className="w-3 h-3" />
                <span>Zoom Out</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="glass-panel p-6 rounded-2xl space-y-4">
        <div className="flex justify-between items-center max-sm:flex-col max-sm:items-start max-sm:gap-3">
          <div className="flex items-center gap-6">
            <div>
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                Clients Database Registry
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                {filteredClients.length} clients matched in this category selection.
              </p>
            </div>
            
            <div className="flex gap-1 p-0.5 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setActiveTableTab("leads")}
                className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase transition cursor-pointer ${
                  activeTableTab === "leads"
                    ? "bg-white dark:bg-slate-800 text-primary shadow-sm"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                Active Leads
              </button>
              <button
                onClick={() => setActiveTableTab("converted")}
                className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase transition cursor-pointer ${
                  activeTableTab === "converted"
                    ? "bg-white dark:bg-slate-800 text-primary shadow-sm"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                Converted Clients
              </button>
            </div>
          </div>

          <div className="relative w-64 max-sm:w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-3.5 h-3.5" />
            </div>
            <input
              type="text"
              placeholder="Search clients by name/firm..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs outline-none focus:border-primary focus:bg-white dark:focus:bg-slate-950 transition"
            />
          </div>
        </div>

        <div className="overflow-x-auto border border-slate-200/50 dark:border-slate-800/50 rounded-xl bg-white/20 dark:bg-slate-950/10">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 text-slate-500 font-bold uppercase text-[9px] tracking-wider">
                <th className="px-6 py-3.5">ID</th>
                <th className="px-6 py-3.5">Client Details</th>
                <th className="px-6 py-3.5">Enterprise Firm</th>
                <th className="px-6 py-3.5">Geographic Nodes</th>
                {activeTableTab === "converted" ? (
                  <th className="px-6 py-3.5">Conversion Info</th>
                ) : (
                  <th className="px-6 py-3.5">Status</th>
                )}
                <th className="px-6 py-3.5 text-right pr-12">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/60 dark:divide-slate-800/80">
              {isLoading && !data ? (
                <ClientsTableSkeleton />
              ) : filteredClients.length > 0 ? (
                filteredClients.slice((clientCurrentPage - 1) * clientsPerPage, clientCurrentPage * clientsPerPage).map((client) => (
                  <tr
                    key={client.id}
                    onClick={() => {
                      setDetailedClient(client);
                      setShowDetailsDrawer(true);
                    }}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-4 font-bold text-slate-400">
                      {client.clientId || client.id}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                        <span>{client.name}</span>
                        {client.sourceLink && (
                          <a
                            href={client.sourceLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-0.5 text-[9px] text-primary hover:underline ml-2"
                            title={`Lead Origin: ${client.source}`}
                          >
                            <span>{client.source}</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-[10px] text-slate-400 mt-1">
                        <span className="flex items-center gap-1">
                          <Mail className="w-3.5 h-3.5" />
                          {client.email || "—"}
                        </span>
                        <span className="flex items-center gap-1">
                          <PhoneCall className="w-3.5 h-3.5" />
                          {client.phone}
                        </span>
                      </div>
                      {client.notes && (
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-2 bg-slate-50 dark:bg-slate-900/60 rounded-lg px-2.5 py-1.5 border border-slate-200/40 dark:border-slate-800/40 italic">
                          <span className="font-bold text-primary not-italic text-[9px] uppercase tracking-wider mr-1">Note:</span>
                          {renderNotesWithMentions(client.notes)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-600 dark:text-slate-300">
                        {client.company}
                      </div>
                      <div className="text-[9px] text-slate-400 mt-0.5">
                        Mode: <strong className="text-slate-500">{client.contactMode}</strong>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span>
                          {client.area ? `${client.area}, ` : ""}{client.city} ({client.pincode})
                        </span>
                      </div>
                    </td>
                    
                    {activeTableTab === "converted" ? (
                      <td className="px-6 py-4">
                        <div className="space-y-1 text-slate-700 dark:text-slate-200">
                          <div className="flex flex-wrap gap-1">
                            {client.appsTaken?.map((app) => (
                              <span key={app} className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded text-[9px] font-bold">
                                {app}
                              </span>
                            )) || <span className="text-slate-400">No apps registered</span>}
                          </div>
                          <div className="text-[10px] text-slate-550 dark:text-slate-400 font-semibold flex items-center gap-2">
                            <span>Paid: <strong className="text-emerald-500 font-bold">Rs.{client.amountPaid}</strong></span>
                            <span>•</span>
                            <span>Seats: <strong className="text-slate-800 dark:text-slate-200 font-bold">{client.seatsCount}</strong></span>
                          </div>
                          {client.conversionNotes && (
                            <div className="text-[9px] text-slate-500 dark:text-slate-400 italic mt-1 max-w-[180px] truncate" title={client.conversionNotes}>
                              &ldquo;{client.conversionNotes}&rdquo;
                            </div>
                          )}
                        </div>
                      </td>
                    ) : (
                      <td className="px-6 py-4">
                        <span className={`flex items-center gap-1.5 font-bold ${
                          client.status === "Active" ? "text-success" : "text-slate-450"
                        }`}>
                          {client.status === "Active" ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : (
                            <XCircle className="w-4 h-4" />
                          )}
                          <span>{client.status}</span>
                        </span>
                      </td>
                    )}

                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 pr-6">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditClick(client);
                          }}
                          className="p-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-350 transition cursor-pointer"
                          title="Edit Client"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteClick(client);
                          }}
                          className="p-1 rounded bg-danger-soft hover:bg-red-200/50 text-danger transition cursor-pointer"
                          title="Delete Client"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        {activeTableTab === "leads" && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setConvertingClient(client);
                              setShowConversionModal(true);
                            }}
                            className="px-2.5 py-1 text-[10px] font-bold bg-success hover:bg-emerald-600 text-white rounded-lg transition cursor-pointer"
                            title="Mark as Converted"
                          >
                            Convert
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400 font-medium">
                    No clients found matching the filters or query. Try clicking higher level maps.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Pagination Controls - only shown when results exceed 10 */}
          {filteredClients.length > clientsPerPage && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/10">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                Showing <strong className="text-slate-800 dark:text-slate-200">{(clientCurrentPage - 1) * clientsPerPage + 1}</strong> – <strong className="text-slate-800 dark:text-slate-200">{Math.min(clientCurrentPage * clientsPerPage, filteredClients.length)}</strong> of <strong className="text-slate-800 dark:text-slate-200">{filteredClients.length}</strong> clients
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setClientCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={clientCurrentPage === 1}
                  className="px-3 py-1 bg-white hover:bg-slate-50 dark:bg-slate-950 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-lg text-[10px] font-bold text-slate-600 dark:text-slate-350 disabled:opacity-40 transition cursor-pointer"
                >
                  ← Prev
                </button>
                {Array.from({ length: Math.ceil(filteredClients.length / clientsPerPage) }).slice(
                  Math.max(0, clientCurrentPage - 3),
                  Math.min(Math.ceil(filteredClients.length / clientsPerPage), clientCurrentPage + 2)
                ).map((_, idx) => {
                  const pageNum = Math.max(0, clientCurrentPage - 3) + idx + 1;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setClientCurrentPage(pageNum)}
                      className={`w-7 h-7 rounded-lg text-[10px] font-bold transition flex items-center justify-center cursor-pointer ${
                        clientCurrentPage === pageNum
                          ? "bg-primary text-white shadow-sm"
                          : "bg-white hover:bg-slate-50 dark:bg-slate-950 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-850 text-slate-600 dark:text-slate-350"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button
                  onClick={() => setClientCurrentPage(prev => Math.min(Math.ceil(filteredClients.length / clientsPerPage), prev + 1))}
                  disabled={clientCurrentPage === Math.ceil(filteredClients.length / clientsPerPage)}
                  className="px-3 py-1 bg-white hover:bg-slate-50 dark:bg-slate-950 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-855 rounded-lg text-[10px] font-bold text-slate-600 dark:text-slate-350 disabled:opacity-40 transition cursor-pointer"
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {isAddDrawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddDrawerOpen(false)}
              className="fixed inset-0 z-40 bg-slate-950"
            />

            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 z-50 shadow-2xl p-6 overflow-y-auto flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-center pb-5 border-b border-slate-200 dark:border-slate-800 mb-6">
                  <div>
                    <h3 className="text-base font-bold text-slate-850 dark:text-slate-100 flex items-center gap-2">
                      <Users className="w-5 h-5 text-primary" />
                      {editingClient ? `Edit Client: ${editingClient.id}` : "Add Client Registry"}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {editingClient ? "Modify client details and configuration parameters." : "Register a new client node to the directory."}
                    </p>
                  </div>
                  <button
                    onClick={handleCloseDrawer}
                    className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 cursor-pointer transition"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleAddClientSubmit} className="space-y-4">
                  {formError && (
                    <div className="p-3 bg-danger-soft border border-danger/10 rounded-xl text-xs text-danger font-semibold">
                      {formError}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">
                        Client Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="John Doe"
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-850 rounded-lg outline-none bg-slate-50/50 dark:bg-slate-950/20 focus:border-primary transition"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">
                        Enterprise Firm *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ansh Technologies"
                        value={formCompany}
                        onChange={(e) => setFormCompany(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-850 rounded-lg outline-none bg-slate-50/50 dark:bg-slate-950/20 focus:border-primary transition"
                      />
                    </div>
                  </div>

                  {/* Registration Date & Day */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase block">
                        Registration Date *
                      </label>
                      <input
                        type="date"
                        required
                        value={formDate}
                        onChange={(e) => setFormDate(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-850 rounded-lg outline-none bg-slate-50/50 dark:bg-slate-950/20 focus:border-primary transition text-slate-900 dark:text-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase block">
                        Day of Week
                      </label>
                      <div className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-850 rounded-lg bg-slate-100 dark:bg-slate-950/40 text-slate-700 dark:text-slate-350 font-bold select-none h-[34px] flex items-center">
                        {formDate ? new Date(formDate).toLocaleDateString("en-US", { weekday: "long" }) : "Select a Date"}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">
                        Email Address
                      </label>
                      <input
                        type="email"
                        placeholder="john.doe@ansh.com (optional)"
                        value={formEmail}
                        onChange={(e) => setFormEmail(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-850 rounded-lg outline-none bg-slate-50/50 dark:bg-slate-950/20 focus:border-primary transition"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">
                        Phone Number *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="+91 99999 88888"
                        value={formPhone}
                        onChange={(e) => setFormPhone(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-850 rounded-lg outline-none bg-slate-50/50 dark:bg-slate-950/20 focus:border-primary transition"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">
                          Address Pincode *
                        </label>
                        {isAutofilling && (
                          <span className="text-[9px] text-primary font-semibold animate-pulse flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
                            Autofilling...
                          </span>
                        )}
                      </div>
                      <input
                        type="text"
                        required
                        placeholder="400001"
                        value={formPincode}
                        onChange={(e) => {
                          setFormPincode(e.target.value);
                          const val = e.target.value.trim();
                          if (/^\d{6}$/.test(val) || /^\d{5}$/.test(val)) {
                            handlePincodeLookup(val);
                          }
                        }}
                        onBlur={() => handlePincodeLookup(formPincode)}
                        className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-850 rounded-lg outline-none bg-slate-50/50 dark:bg-slate-950/20 focus:border-primary transition"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">
                        Lead Source *
                      </label>
                      <div className="relative">
                        <select
                          value={formSource}
                          onChange={(e) => setFormSource(e.target.value)}
                          className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-850 rounded-lg outline-none bg-slate-50/50 dark:bg-slate-950/20 focus:border-primary appearance-none transition"
                        >
                          <option value="LinkedIn">LinkedIn</option>
                          <option value="Twitter / X">Twitter / X</option>
                          <option value="Google Search">Google Search</option>
                          <option value="YouTube">YouTube</option>
                          <option value="Instagram">Instagram</option>
                          <option value="Facebook">Facebook</option>
                          <option value="TikTok">TikTok</option>
                          <option value="Reddit">Reddit</option>
                          <option value="Blog Post">Blog Post</option>
                          <option value="Podcast">Podcast Referral</option>
                          <option value="Direct Search">Direct Search</option>
                          <option value="Conference / Event">Conference / Event</option>
                          <option value="Email Campaign">Email Campaign</option>
                          <option value="Product Hunt">Product Hunt</option>
                          <option value="Partner / Affiliate">Partner / Affiliate</option>
                          <option value="Referral">Direct Referral</option>
                          <option value="Cold Outreach">Cold Outreach</option>
                          <option value="Other">Other Source</option>
                        </select>
                        <ChevronDown className="w-3.5 h-3.5 absolute right-3 top-2.5 text-slate-400 pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1 col-span-2">
                      <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">
                        Source Link (URL)
                      </label>
                      <input
                        type="url"
                        placeholder="https://linkedin.com/in/username"
                        value={formSourceLink}
                        onChange={(e) => setFormSourceLink(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-850 rounded-lg outline-none bg-slate-50/50 dark:bg-slate-950/20 focus:border-primary transition"
                      />
                    </div>
                  </div>

                  <div className="space-y-1 relative">
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase block">
                      Client Notes & Mentions
                    </label>
                    <div className="relative">
                      <textarea
                        rows={3}
                        placeholder="Add notes. Type @ to mention a team member..."
                        value={formNotes}
                        onChange={handleNotesChange}
                        onKeyDown={handleNotesKeyDown}
                        className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-850 rounded-lg outline-none bg-slate-50/50 dark:bg-slate-950/20 focus:border-primary transition resize-none"
                      />
                      
                      <AnimatePresence>
                        {showMentionDropdown && filteredMentions.length > 0 && (
                          <motion.div
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 5 }}
                            className="absolute z-50 left-2 bottom-full mb-1 w-52 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-xl overflow-hidden"
                          >
                            <div className="p-1.5 bg-slate-50 dark:bg-slate-950 text-[9px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-850">
                              Mention Team Member
                            </div>
                            <ul className="max-h-36 overflow-y-auto py-1">
                              {filteredMentions.map((user, idx) => {
                                const isSelected = idx === selectedMentionIdx;
                                return (
                                  <li key={user.id}>
                                    <button
                                      type="button"
                                      onClick={() => handleMentionSelect(user.id)}
                                      className={`w-full text-left px-3 py-1.5 text-xs flex flex-col transition cursor-pointer ${
                                        isSelected
                                          ? "bg-primary/10 text-primary"
                                          : "text-slate-700 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-950"
                                      }`}
                                    >
                                      <span className="font-bold">@{user.id}</span>
                                      <span className="text-[9px] text-slate-400">{user.name} ({user.role})</span>
                                    </button>
                                  </li>
                                );
                              })}
                            </ul>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase block">
                      Primary Contact Mode
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {["Call", "Message", "WhatsApp", "Instagram", "YouTube", "Email", "Direct", "LinkedIn"].map((mode) => {
                        const isSelected = formContactMode === mode;
                        return (
                          <button
                            type="button"
                            key={mode}
                            onClick={() => setFormContactMode(mode)}
                            className={`py-1.5 px-1 rounded-lg text-[10px] font-bold border transition text-center cursor-pointer ${
                              isSelected
                                ? "bg-primary border-primary text-white shadow-sm"
                                : "bg-slate-50 dark:bg-slate-950/20 border-slate-200 dark:border-slate-850 text-slate-600 dark:text-slate-400 hover:border-slate-300"
                            }`}
                          >
                            {mode}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-3.5 border-t border-slate-200/50 dark:border-slate-800/50 pt-4">
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase block tracking-wider">
                      Geographic Location Registry
                    </span>

                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase">
                        Country *
                      </label>
                      <div className="relative">
                        <select
                          value={formCountry}
                          onChange={(e) => handleFormCountryChange(e.target.value)}
                          className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-850 rounded-lg outline-none bg-slate-50/50 dark:bg-slate-950/20 focus:border-primary appearance-none transition font-semibold"
                        >
                          {allCountries.map((c) => (
                            <option key={c.isoCode} value={c.isoCode}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                        <Globe2 className="w-3.5 h-3.5 absolute right-3 top-2.5 text-slate-400 pointer-events-none" />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase">
                        State / Territory *
                      </label>
                      <div className="relative">
                        <select
                          value={formState}
                          onChange={(e) => handleFormStateChange(e.target.value)}
                          className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-850 rounded-lg outline-none bg-slate-50/50 dark:bg-slate-950/20 focus:border-primary appearance-none transition"
                        >
                          <option value="">-- Select State --</option>
                          {formStatesList.map((s) => (
                            <option key={s.isoCode} value={s.isoCode}>
                              {s.name}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="w-3.5 h-3.5 absolute right-3 top-2.5 text-slate-400 pointer-events-none" />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase">
                        City / District *
                      </label>
                      <div className="relative">
                        <select
                          value={formCity}
                          disabled={!formState}
                          onChange={(e) => handleFormCityChange(e.target.value)}
                          className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-850 rounded-lg outline-none bg-slate-50/50 dark:bg-slate-950/20 focus:border-primary disabled:opacity-50 appearance-none transition"
                        >
                          <option value="">-- Select City --</option>
                          {formCitiesList.map((c) => (
                            <option key={c.name} value={c.name}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="w-3.5 h-3.5 absolute right-3 top-2.5 text-slate-400 pointer-events-none" />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase">
                        Specific Area / Sector *
                      </label>
                      <div className="relative">
                        <select
                          value={formArea}
                          disabled={!formCity}
                          onChange={(e) => handleFormAreaChange(e.target.value)}
                          className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-850 rounded-lg outline-none bg-slate-50/50 dark:bg-slate-950/20 focus:border-primary disabled:opacity-50 appearance-none transition"
                        >
                          <option value="">-- Select Area --</option>
                          {formAreasList.map((a) => (
                            <option key={a.id} value={a.name}>
                              {a.name}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="w-3.5 h-3.5 absolute right-3 top-2.5 text-slate-400 pointer-events-none" />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase">
                        Manual Address (optional)
                      </label>
                      <textarea
                        rows={2}
                        placeholder="Flat no., street, landmark, or any extra address details..."
                        value={formManualAddress}
                        onChange={(e) => setFormManualAddress(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-850 rounded-lg outline-none bg-slate-50/50 dark:bg-slate-950/20 focus:border-primary transition resize-none"
                      />
                    </div>
                  </div>
                </form>
              </div>

              <div className="border-t border-slate-200 dark:border-slate-800 pt-4 mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={handleCloseDrawer}
                  className="flex-1 py-2 rounded-xl border border-slate-350 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-950 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  onClick={handleAddClientSubmit}
                  className="flex-1 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl shadow-md shadow-primary/20 flex items-center justify-center gap-1.5 cursor-pointer transition hover:scale-102"
                >
                  <span>{editingClient ? "Save Updates" : "Register Client"}</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showConversionModal && convertingClient && (
          <>
            {/* Modal Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setShowConversionModal(false);
                setConvertingClient(null);
              }}
              className="fixed inset-0 z-50 bg-slate-950"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-3xl p-6 z-55 shadow-2xl space-y-6"
            >
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-success" />
                  Convert Lead: {convertingClient.name}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Specify product configuration parameters for {convertingClient.company}.
                </p>
              </div>

              <form onSubmit={handleSaveConversion} className="space-y-4">
                {/* Apps Taken Checkbox List */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 block">
                    Software Products Purchased
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {AVAILABLE_APPS.map((app) => {
                      const isChecked = conversionApps.includes(app);
                      return (
                        <label
                          key={app}
                          className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-[11px] font-semibold transition cursor-pointer select-none ${
                            isChecked
                              ? "bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400"
                              : "bg-slate-50 dark:bg-slate-950/20 border-slate-300 dark:border-slate-850 text-slate-700 dark:text-slate-300 hover:bg-slate-100/50"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              if (isChecked) {
                                setConversionApps((prev) => prev.filter((a) => a !== app));
                              } else {
                                setConversionApps((prev) => [...prev, app]);
                              }
                            }}
                            className="hidden"
                          />
                          <span>{app}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Amount Paid & Seats count */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-600 block">
                      Total Amount Paid ($) *
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      placeholder="1200"
                      value={conversionAmount}
                      onChange={(e) => setConversionAmount(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-850 rounded-lg outline-none bg-slate-50/50 dark:bg-slate-950/20 focus:border-primary transition text-slate-900 dark:text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-600 block">
                      Seats Purchased *
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      placeholder="5"
                      value={conversionSeats}
                      onChange={(e) => setConversionSeats(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-850 rounded-lg outline-none bg-slate-50/50 dark:bg-slate-950/20 focus:border-primary transition text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                {/* Conversion Notes */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-600 block">
                    Conversion Notes / Custom terms
                  </label>
                  <textarea
                    rows={2}
                    placeholder="E.g. Annual contract, net 30 billing..."
                    value={conversionNotes}
                    onChange={(e) => setConversionNotes(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-850 rounded-lg outline-none bg-slate-50/50 dark:bg-slate-950/20 focus:border-primary transition resize-none text-slate-900 dark:text-white"
                  />
                </div>

                {/* Submit & Cancel */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowConversionModal(false);
                      setConvertingClient(null);
                    }}
                    className="flex-1 py-2 rounded-xl border border-slate-300 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-955 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 bg-success hover:bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-md shadow-success/20 transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span>Save Conversion</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Custom Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && deletingClient && (
          <>
            {/* Modal Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setShowDeleteModal(false);
                setDeletingClient(null);
                setDeleteConfirmName("");
              }}
              className="fixed inset-0 z-50 bg-slate-950"
            />

            {/* Modal Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-3xl p-6 z-55 shadow-2xl space-y-6"
            >
              <div className="text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-danger-soft text-danger flex items-center justify-center mx-auto border border-danger/25">
                  <Trash2 className="w-6 h-6 animate-pulse" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Confirm Registry Deletion
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal">
                  Are you sure you want to permanently delete the registry for <strong className="text-slate-850 dark:text-slate-200 font-extrabold">{deletingClient.name}</strong>? This action is irreversible.
                </p>
              </div>

              <form onSubmit={handleConfirmDelete} className="space-y-4">
                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] font-bold text-slate-600 dark:text-slate-455 uppercase block">
                    Type client name to confirm:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={deletingClient.name}
                    value={deleteConfirmName}
                    onChange={(e) => setDeleteConfirmName(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-850 rounded-lg outline-none bg-slate-50/50 dark:bg-slate-950/20 focus:border-primary transition text-slate-900 dark:text-white placeholder:opacity-50"
                  />
                  <span className="text-[9px] text-slate-500 dark:text-slate-400 font-semibold block">
                    Type/copy-paste: <span className="font-bold text-slate-650 dark:text-slate-300 select-all">{deletingClient.name}</span>
                  </span>
                </div>

                {/* Buttons */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowDeleteModal(false);
                      setDeletingClient(null);
                      setDeleteConfirmName("");
                    }}
                    className="flex-1 py-2 rounded-xl border border-slate-300 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-955 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={deleteConfirmName.trim() !== deletingClient.name}
                    className="flex-1 py-2 bg-danger hover:bg-red-600 disabled:opacity-40 text-white text-xs font-bold rounded-xl shadow-md shadow-danger/20 transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span>Delete Registry</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Slide-over Drawer for Viewing Client Details */}
      <AnimatePresence>
        {showDetailsDrawer && detailedClient && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setShowDetailsDrawer(false);
                setDetailedClient(null);
              }}
              className="fixed inset-0 z-40 bg-slate-950"
            />

            {/* Slide-over panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white dark:bg-slate-900 border-l border-slate-300 dark:border-slate-800 z-50 shadow-2xl p-6 overflow-y-auto flex flex-col justify-between"
            >
              <div className="space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center pb-5 border-b border-slate-200 dark:border-slate-800">
                  <div>
                    <span className="text-[10px] font-bold text-primary uppercase tracking-wider block">
                      Client Profile Dossier
                    </span>
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mt-1">
                      {detailedClient.name} ({detailedClient.clientId || detailedClient.id})
                    </h3>
                  </div>
                  <button
                    onClick={() => {
                      setShowDetailsDrawer(false);
                      setDetailedClient(null);
                    }}
                    className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-pointer transition"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Profile Overview */}
                <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-950/40 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800/60">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-primary to-accent flex items-center justify-center text-white text-base font-bold shadow-md shadow-primary/10 shrink-0">
                    {detailedClient.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-850 dark:text-slate-100">
                      {detailedClient.company}
                    </h4>
                    <p className="text-[10px] text-slate-550 dark:text-slate-400 font-semibold mt-0.5">
                      Source: <span className="text-primary">{detailedClient.source}</span>
                    </p>
                  </div>
                </div>

                {/* Details Section */}
                <div className="space-y-4">
                  {/* Contact Info */}
                  <div className="space-y-2">
                    <span className="text-[9px] font-bold text-slate-600 dark:text-slate-500 uppercase tracking-wider block">
                      Contact Information
                    </span>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="bg-slate-50 dark:bg-slate-950/20 p-2.5 rounded-xl border border-slate-200/50 dark:border-slate-850">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-semibold">Email Address</span>
                        <span className="font-bold text-slate-900 dark:text-white block mt-0.5 break-all">{detailedClient.email || "—"}</span>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-950/20 p-2.5 rounded-xl border border-slate-200/50 dark:border-slate-850">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-semibold">Phone Number</span>
                        <span className="font-bold text-slate-900 dark:text-white block mt-0.5">{detailedClient.phone}</span>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-950/20 p-2.5 rounded-xl border border-slate-200/50 dark:border-slate-850">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-semibold">Contact Mode</span>
                        <span className="font-bold text-primary block mt-0.5">{detailedClient.contactMode}</span>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-950/20 p-2.5 rounded-xl border border-slate-200/50 dark:border-slate-850">
                        <span className="text-[10px] text-slate-550 dark:text-slate-400 block font-semibold">System Status</span>
                        <span className={`font-bold block mt-0.5 ${detailedClient.status === "Active" ? "text-success" : "text-slate-500"}`}>
                          {detailedClient.status}
                        </span>
                      </div>
                      {detailedClient.createdAt && (
                        <div className="bg-slate-50 dark:bg-slate-950/20 p-2.5 rounded-xl border border-slate-200/50 dark:border-slate-850 col-span-2">
                          <span className="text-[10px] text-slate-550 dark:text-slate-455 block font-bold flex items-center gap-1.5 uppercase tracking-wider">
                            <Calendar className="w-3.5 h-3.5 text-primary" />
                            Registration Date & Day
                          </span>
                          <span className="font-extrabold text-slate-900 dark:text-white block mt-0.5">
                            {new Date(detailedClient.createdAt).toLocaleDateString("en-US", {
                              weekday: "long",
                              year: "numeric",
                              month: "long",
                              day: "numeric"
                            })}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Geographical Registry */}
                  <div className="space-y-2">
                    <span className="text-[9px] font-bold text-slate-600 dark:text-slate-500 uppercase tracking-wider block">
                      Geographical Registry Parameters
                    </span>
                    <div className="bg-slate-50 dark:bg-slate-950/20 p-3 rounded-xl border border-slate-200/50 dark:border-slate-850 space-y-2.5 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 dark:text-slate-400 font-semibold">Country</span>
                        <span className="font-bold text-slate-900 dark:text-white">{detailedClient.country}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 dark:text-slate-400 font-semibold">State / Territory</span>
                        <span className="font-bold text-slate-900 dark:text-white">{detailedClient.state}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 dark:text-slate-400 font-semibold">City / District</span>
                        <span className="font-bold text-slate-900 dark:text-white">{detailedClient.city}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 dark:text-slate-400 font-semibold">Specific Area / Suburb</span>
                        <span className="font-bold text-slate-900 dark:text-white">{detailedClient.area || "N/A"}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 dark:text-slate-400 font-semibold">Address Pincode</span>
                        <span className="font-bold text-primary">{detailedClient.pincode}</span>
                      </div>
                      {detailedClient.manualAddress && (
                        <div className="pt-1 border-t border-slate-200/50 dark:border-slate-800/50">
                          <span className="text-slate-500 dark:text-slate-400 font-semibold block mb-1">Manual Address</span>
                          <span className="font-bold text-slate-900 dark:text-white leading-relaxed">{detailedClient.manualAddress}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Product Conversion Info (If Converted) */}
                  {detailedClient.isConverted && (
                    <div className="space-y-2">
                      <span className="text-[9px] font-bold text-slate-600 dark:text-slate-500 uppercase tracking-wider block">
                        Product Conversion Parameters
                      </span>
                      <div className="bg-emerald-500/5 dark:bg-emerald-500/10 p-3.5 rounded-xl border border-emerald-500/20 space-y-2.5 text-xs">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500 dark:text-slate-400 font-semibold">Conversion Date</span>
                          <span className="font-bold text-slate-900 dark:text-white">{detailedClient.convertedAt}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500 dark:text-slate-400 font-semibold">Total Revenue Paid</span>
                          <span className="font-extrabold text-emerald-500">Rs.{detailedClient.amountPaid}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500 dark:text-slate-400 font-semibold">Seats Allocated</span>
                          <span className="font-bold text-slate-900 dark:text-white">{detailedClient.seatsCount} users</span>
                        </div>
                        <div className="space-y-1">
                          <span className="text-slate-500 dark:text-slate-400 font-semibold block">Products Purchased</span>
                          <div className="flex flex-wrap gap-1.5 pt-0.5">
                            {detailedClient.appsTaken?.map((app) => (
                              <span key={app} className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-md text-[9px] font-bold border border-emerald-500/15">
                                {app}
                              </span>
                            ))}
                          </div>
                        </div>
                        {detailedClient.conversionNotes && (
                          <div className="pt-1.5 border-t border-emerald-500/10">
                            <span className="text-slate-550 dark:text-slate-400 font-semibold block text-[10px]">Conversion Notes</span>
                            <p className="text-[11px] text-slate-600 dark:text-slate-350 italic mt-0.5 leading-normal">
                              &ldquo;{detailedClient.conversionNotes}&rdquo;
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Notes / Internal Comments */}
                  <div className="space-y-2">
                    <span className="text-[9px] font-bold text-slate-600 dark:text-slate-500 uppercase tracking-wider block">
                      Internal Notes & Mentions
                    </span>
                    <div className="bg-slate-50 dark:bg-slate-950/20 p-3 rounded-xl border border-slate-200/50 dark:border-slate-850 text-xs leading-normal">
                      {detailedClient.notes ? (
                        <p className="italic text-slate-700 dark:text-slate-300">
                          {renderNotesWithMentions(detailedClient.notes)}
                        </p>
                      ) : (
                        <span className="text-slate-450 font-semibold italic">No notes written for this client.</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="border-t border-slate-200 dark:border-slate-800 pt-4 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowDetailsDrawer(false);
                    setDetailedClient(null);
                  }}
                  className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 transition cursor-pointer text-center"
                >
                  Close Dossier
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
