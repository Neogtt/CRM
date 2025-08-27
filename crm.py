# crm_summary.py
import streamlit as st
import pandas as pd
import datetime
from google.oauth2 import service_account
from googleapiclient.discovery import build

# ======================
# GENEL AYARLAR
# ======================
st.set_page_config(page_title="ŞEKEROĞLU ÖZET", layout="wide")

SHEET_ID = "1A_gL11UL6JFAoZrMrg92K8bAegeCn_KzwUyU8AWzE_0"
SAYFA_PROFORMA = "Proformalar"
SAYFA_EVRAK = "Evraklar"

# ======================
# KULLANICI GİRİŞİ
# ======================
USERS = {"Boss": "Seker12345!"}
if "user" not in st.session_state: st.session_state.user = None

def login_screen():
    st.title("Özet Ekran Girişi")
    u = st.text_input("Kullanıcı Adı")
    p = st.text_input("Şifre", type="password")
    if st.button("Giriş"):
        if u in USERS and p == USERS[u]:
            st.session_state.user = u
            st.rerun()
        else:
            st.error("Hatalı giriş!")

if not st.session_state.user:
    login_screen()
    st.stop()

# ======================
# GOOGLE SHEETS BAĞLANTI
# ======================
@st.cache_resource
def build_sheets():
    creds = service_account.Credentials.from_service_account_info(
        st.secrets["gcp_service_account"],
        scopes=["https://www.googleapis.com/auth/spreadsheets.readonly"]
    )
    return build("sheets", "v4", credentials=creds, cache_discovery=False)

sheets_svc = build_sheets()

def load_sheet(sheet_name):
    result = sheets_svc.spreadsheets().values().get(
        spreadsheetId=SHEET_ID,
        range=f"{sheet_name}!A:Z"
    ).execute()
    values = result.get("values", [])
    if not values: return pd.DataFrame()
    return pd.DataFrame(values[1:], columns=values[0])

df_proforma = load_sheet(SAYFA_PROFORMA)
df_evrak = load_sheet(SAYFA_EVRAK)

# ======================
# ÖZET EKRAN
# ======================
st.title("📊 ŞEKEROĞLU CRM - Özet Ekran")

# === PROFORMA ÖZET ===
if not df_proforma.empty:
    st.markdown("### 📑 Proformalar")
    df_proforma["Tutar"] = pd.to_numeric(df_proforma.get("Tutar", 0), errors="coerce").fillna(0)
    toplam = df_proforma["Tutar"].sum()
    bekleyen = df_proforma[df_proforma["Durum"]=="Beklemede"]["Tutar"].sum()
    st.info(f"Toplam Proforma: {toplam:,.2f} $ | Bekleyen: {bekleyen:,.2f} $")
    st.dataframe(df_proforma[["Müşteri Adı","Proforma No","Tarih","Tutar","Durum"]].tail(10))
else:
    st.warning("Proforma bulunamadı.")

# === VADE TAKİBİ (Evraklar) ===
if not df_evrak.empty and "Vade Tarihi" in df_evrak.columns:
    st.markdown("### ⏰ Vade Takibi")
    df_evrak["Tutar"] = pd.to_numeric(df_evrak.get("Tutar", 0), errors="coerce").fillna(0)
    df_evrak["Vade Tarihi"] = pd.to_datetime(df_evrak["Vade Tarihi"], errors="coerce")

    # 🔑 Ödendi olanları çıkar
    if "Ödendi" in df_evrak.columns:
        df_vade = df_evrak[df_evrak["Ödendi"].astype(str).str.lower() != "true"].copy()
    else:
        df_vade = df_evrak.copy()

    bugun = datetime.date.today()
    df_vade["Durum_Vade"] = df_vade["Vade Tarihi"].apply(
        lambda d: "⏳ Beklemede" if pd.notna(d) and d >= pd.Timestamp(bugun) else (
                   "⚠️ Gecikmiş" if pd.notna(d) and d < pd.Timestamp(bugun) else "❓")
    )
    st.dataframe(df_vade[["Müşteri Adı","Proforma No","Fatura No","Vade Tarihi","Tutar","Durum_Vade"]].tail(10))
else:
    st.warning("Evraklar sayfasında 'Vade Tarihi' bilgisi bulunamadı.")

# === ETA TAKİBİ ===
if not df_proforma.empty and "Sevk Durumu" in df_proforma.columns:
    st.markdown("### 🛳️ ETA Takibi")
    sevkedilen = df_proforma[df_proforma["Sevk Durumu"]=="Sevkedildi"].copy()
    if sevkedilen.empty:
        st.info("Yolda olan sipariş yok.")
    else:
        sevkedilen["Tarih"] = pd.to_datetime(sevkedilen["Tarih"], errors="coerce").dt.strftime("%d/%m/%Y")
        st.dataframe(sevkedilen[["Müşteri Adı","Ülke","Proforma No","Tarih","Tutar","Sevk Durumu"]].tail(10))
