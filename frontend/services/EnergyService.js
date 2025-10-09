import AsyncStorage from '@react-native-async-storage/async-storage';
import { DiamondService } from './DiamondService';

const ENERGY_KEY = 'user_energy';
const LAST_ENERGY_UPDATE_KEY = 'last_energy_update';
const MAX_ENERGY = 5;
const ENERGY_RECHARGE_TIME = 60 * 60 * 1000; // 60 dakika (milisaniye)
const ENERGY_COST_PER_GAME = 1; // Sadece online mod için geçerlidir
const DIAMONDS_PER_FULL_ENERGY = 50; // 5 enerji için 50 elmas

export const EnergyService = {

  // Local storage'dan enerji al
  async getEnergyFromStorage() {
    try {
      const energy = await AsyncStorage.getItem(ENERGY_KEY);
      return energy ? parseInt(energy) : MAX_ENERGY; // İlk kez açıldığında full enerji
    } catch (error) {
      console.error('Error getting energy from storage:', error);
      return MAX_ENERGY;
    }
  },

  // Son enerji güncellemesi zamanını al
  async getLastEnergyUpdate() {
    const lastUpdate = await AsyncStorage.getItem(LAST_ENERGY_UPDATE_KEY);
    if (lastUpdate) {
      return parseInt(lastUpdate);
    }
    // İlk kez kullanılıyorsa şu anki zamanı kaydet
    const now = Date.now();
    await AsyncStorage.setItem(LAST_ENERGY_UPDATE_KEY, now.toString());
    return now;
  },

  // Enerji hesapla ve güncelle
  async calculateAndUpdateEnergy() {
    const currentTime = Date.now();
    const lastUpdate = await this.getLastEnergyUpdate();
    const currentEnergy = await this.getEnergyFromStorage();

    // Enerji zaten maksimumsa, son güncelleme zamanını şu anki zamana ayarla
    if (currentEnergy >= MAX_ENERGY) {
      await AsyncStorage.setItem(LAST_ENERGY_UPDATE_KEY, currentTime.toString());
      return currentEnergy;
    }

    const timePassed = currentTime - lastUpdate;
    const energyToAdd = Math.floor(timePassed / ENERGY_RECHARGE_TIME);

    if (energyToAdd > 0) {
      const newEnergy = Math.min(currentEnergy + energyToAdd, MAX_ENERGY);
      const newLastUpdate = lastUpdate + (energyToAdd * ENERGY_RECHARGE_TIME);
      
      await AsyncStorage.setItem(ENERGY_KEY, newEnergy.toString());
      await AsyncStorage.setItem(LAST_ENERGY_UPDATE_KEY, newLastUpdate.toString());
      
      return newEnergy;
    }

    return currentEnergy;
  },

  // Mevcut enerji miktarını al
  async getCurrentEnergy() {
    return await this.calculateAndUpdateEnergy();
  },

  // Enerji kullan (sadece online oyun başlatırken)
  async useEnergy(amount = ENERGY_COST_PER_GAME) {
    const currentEnergy = await this.getCurrentEnergy();
    
    if (currentEnergy < amount) {
      throw new Error('Yetersiz enerji!');
    }

    const newEnergy = currentEnergy - amount;
    await AsyncStorage.setItem(ENERGY_KEY, newEnergy.toString());

    return newEnergy;
  },

  // Enerji kontrolü yap
  async hasEnoughEnergy(amount = ENERGY_COST_PER_GAME) {
    const currentEnergy = await this.getCurrentEnergy();
    return currentEnergy >= amount;
  },

  // Elmasla enerji satın al
  async buyEnergyWithDiamonds() {
    // Enerji zaten tam doluysa satın alma işlemini engelle
    const currentEnergy = await this.getCurrentEnergy();
    if (currentEnergy >= MAX_ENERGY) {
      return false;
    }

    const currentDiamonds = await DiamondService.getDiamonds();
    
    if (currentDiamonds < DIAMONDS_PER_FULL_ENERGY) {
      return false;
    }

    // Elmas harca
    const spendSuccess = await DiamondService.spendDiamonds(DIAMONDS_PER_FULL_ENERGY);
    
    if (!spendSuccess) {
      return false;
    }
    
    // Enerjiyi full yap
    await AsyncStorage.setItem(ENERGY_KEY, MAX_ENERGY.toString());
    await AsyncStorage.setItem(LAST_ENERGY_UPDATE_KEY, Date.now().toString());

    return true;
  },

  // Bir sonraki enerji ne zaman gelecek (milisaniye)
  async getTimeUntilNextEnergy() {
    const currentEnergy = await this.getCurrentEnergy();
    
    if (currentEnergy >= MAX_ENERGY) {
      return 0;
    }

    const lastUpdate = await this.getLastEnergyUpdate();
    const nextEnergyTime = lastUpdate + ENERGY_RECHARGE_TIME;
    const timeUntilNext = nextEnergyTime - Date.now();
    
    return Math.max(0, timeUntilNext);
  },

  // Enerji bilgilerini formatla
  async getEnergyInfo() {
    const currentEnergy = await this.getCurrentEnergy();
    const timeUntilNext = await this.getTimeUntilNextEnergy();
    
    return {
      current: currentEnergy,
      max: MAX_ENERGY,
      timeUntilNext,
      costPerGame: ENERGY_COST_PER_GAME,
      diamondCostForFull: DIAMONDS_PER_FULL_ENERGY,
      rechargeTimeMinutes: ENERGY_RECHARGE_TIME / (60 * 1000)
    };
  },

  // Enerji sıfırla (test için)
  async resetEnergy() {
    const now = Date.now();
    await AsyncStorage.setItem(ENERGY_KEY, MAX_ENERGY.toString());
    await AsyncStorage.setItem(LAST_ENERGY_UPDATE_KEY, now.toString());
    console.log('Energy reset to full, last update set to:', new Date(now).toLocaleString());
  },

  // Enerji sistemini başlat (ilk kurulum için)
  async initializeEnergySystem() {
    const currentEnergy = await AsyncStorage.getItem(ENERGY_KEY);
    const lastUpdate = await AsyncStorage.getItem(LAST_ENERGY_UPDATE_KEY);
    
    if (!currentEnergy || !lastUpdate) {
      const now = Date.now();
      await AsyncStorage.setItem(ENERGY_KEY, MAX_ENERGY.toString());
      await AsyncStorage.setItem(LAST_ENERGY_UPDATE_KEY, now.toString());
      console.log('Energy system initialized with full energy');
    }
  },

  // Debug fonksiyonu
  async debugEnergyStatus() {
    const currentTime = Date.now();
    const lastUpdate = await this.getLastEnergyUpdate();
    const currentEnergy = await this.getEnergyFromStorage();
    const timePassed = currentTime - lastUpdate;
    const energyToAdd = Math.floor(timePassed / ENERGY_RECHARGE_TIME);
    
    console.log('=== ENERGY DEBUG ===');
    console.log('Current Time:', new Date(currentTime).toLocaleString());
    console.log('Last Update:', new Date(lastUpdate).toLocaleString());
    console.log('Current Energy:', currentEnergy);
    console.log('Time Passed (ms):', timePassed);
    console.log('Time Passed (minutes):', Math.floor(timePassed / (60 * 1000)));
    console.log('Energy Recharge Time (ms):', ENERGY_RECHARGE_TIME);
    console.log('Energy Recharge Time (minutes):', ENERGY_RECHARGE_TIME / (60 * 1000));
    console.log('Energy to Add:', energyToAdd);
    console.log('==================');
    
    return {
      currentTime,
      lastUpdate,
      currentEnergy,
      timePassed,
      energyToAdd,
      rechargeTime: ENERGY_RECHARGE_TIME
    };
  },

  // Enerji ekle (reklam ödülü için)
  async addEnergy(amount) {
    try {
      const currentEnergy = await this.getCurrentEnergy();
      const newEnergy = Math.min(currentEnergy + amount, MAX_ENERGY);
      
      await AsyncStorage.setItem(ENERGY_KEY, newEnergy.toString());
      await AsyncStorage.setItem(LAST_ENERGY_UPDATE_KEY, Date.now().toString());
      
      return true;
    } catch (error) {
      console.error('Error adding energy:', error);
      return false;
    }
  },

  // Sabitler
  MAX_ENERGY,
  ENERGY_RECHARGE_TIME,
  ENERGY_COST_PER_GAME,
  DIAMONDS_PER_FULL_ENERGY
};