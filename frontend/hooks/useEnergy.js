import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setEnergy, setEnergyLoading, updateEnergyTime } from '../store/slices/energySlice';
import { EnergyService } from '../services/EnergyService';

const useEnergy = () => {
  const dispatch = useDispatch();
  const energy = useSelector(state => state.energy);

  const loadEnergy = async () => {
    try {
      dispatch(setEnergyLoading(true));
      const energyData = await EnergyService.getEnergyInfo();
      dispatch(setEnergy({
        current: energyData.current,
        max: energyData.max,
        timeUntilNext: energyData.timeUntilNext,
      }));
    } catch (error) {
      console.error('Error loading energy:', error);
    } finally {
      dispatch(setEnergyLoading(false));
    }
  };

  const hasEnoughEnergy = async (amount = 1) => {
    try {
      return await EnergyService.hasEnoughEnergy(amount);
    } catch (error) {
      console.error('Error checking energy:', error);
      return false;
    }
  };

  const useEnergyFunc = async (amount = 1) => {
    try {
      await EnergyService.useEnergy(amount);
      await loadEnergy(); // Enerji kullanıldıktan sonra yenile
      return true;
    } catch (error) {
      console.error('Error using energy:', error);
      return false;
    }
  };

  const buyEnergy = async () => {
    try {
      const success = await EnergyService.buyEnergyWithDiamonds();
      if (success) {
        await loadEnergy(); // Enerji satın alındıktan sonra yenile
      }
      return success;
    } catch (error) {
      console.error('Error buying energy:', error);
      return false;
    }
  };

  // Energy zamanlayıcısı
  useEffect(() => {
    if (energy.timeUntilNext > 0) {
      const interval = setInterval(() => {
        dispatch(updateEnergyTime());
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [energy.timeUntilNext, dispatch]);

  return {
    energy: energy.current,
    maxEnergy: energy.max,
    timeUntilNext: energy.timeUntilNext,
    isLoading: energy.isLoading,
    loadEnergy,
    hasEnoughEnergy,
    useEnergy: useEnergyFunc,
    buyEnergy,
  };
};

export default useEnergy;