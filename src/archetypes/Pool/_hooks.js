import { useState, useEffect } from 'react';
import { units, format } from '@util/helpers';
import { useConversion } from '@util/currencyConvert';
import { Transaction } from '@archetypes';
import AppStore from '@app/App.Store';
import { StakingRewards } from '@util/contracts';

export const usePool = (address) => {
  const [data, setData] = useState({});
  const { state, subscribe } = AppStore();

  useEffect(() => {
    let sub = subscribe(`pool.${address}`, setData);
    return () => sub.unsubscribe();
  }, [state.pool[address]]); // eslint-disable-line

  return data;
};

export const usePosition = (address) => {
  const [data, setData] = useState();
  const { state, subscribe } = AppStore();

  useEffect(() => {
    let sub = subscribe(`pool.${address}.userPosition`, setData);
    return () => sub.unsubscribe();
  }, [state.pool[address]]); // eslint-disable-line

  return data;
};

export const useDeposited = (address) => {
  const [data, setData] = useState();
  const pool = usePool(address);
  const token0Rate = useConversion(1, pool?.token0?.currencyKey, 'usd');
  const token1Rate = useConversion(1, pool?.token1?.currencyKey, 'usd');

  useEffect(() => {
    if (
      pool?.token0?.currencyKey &&
      pool?.token1?.currencyKey &&
      token0Rate &&
      token1Rate &&
      pool?.token0?.balance &&
      pool?.token1?.balance
    ) {
      let totalDeposited;
      if (token0Rate === -1) {
        totalDeposited =
          token1Rate * units.fromWei(pool?.token1?.balance || 0) * 2;
      } else if (token1Rate === -1) {
        totalDeposited =
          token0Rate * units.fromWei(pool?.token0?.balance || 0) * 2;
      } else {
        totalDeposited =
          token0Rate * units.fromWei(pool?.token0?.balance || 0) +
          token1Rate * units.fromWei(pool?.token1?.balance || 0);
      }

      const totalStaked = (totalDeposited / pool?.totalSupply)*pool?.staked

      setData(totalStaked);
    }
  }, [
    pool?.token0?.currencyKey,
    pool?.token1?.currencyKey,
    token0Rate,
    token1Rate,
    pool?.token0?.balance,
    pool?.token1?.balance,
  ]);

  return data;
};

export const useUserStake = (address) => {
  const [data, setData] = useState();
  const pool = usePool(address);
  const deposited = useDeposited(address);

  useEffect(() => {
    if (pool?.userPosition?.staked && !!pool?.totalSupply && !!deposited) {
      const userBalancePercent =
        (100 / pool?.totalSupply) * pool?.userPosition?.staked * 0.01;
      setData(deposited * userBalancePercent);
    }
  }, [deposited, pool?.userPosition?.staked, pool?.totalSupply]);

  return data;
};

// stake signature: [amount]
export const useStakingTransaction = ({ address, onSuccess }) => {
  const { state } = AppStore();

  const transaction = Transaction.useTokenTransaction({
    abi: StakingRewards,
    address: state.pool[address].rewardsAddress,
    method: 'stake',
    params: ['amount'],
    controls: {
      name: 'Stake',
      approvals: [
        {
          token: state.pool[address].address,
          contract: state.pool[address].rewardsAddress,
        },
      ],
    },
    txMessage: ({ amount }) => `${units.fromWei(amount)} LINKSWAP LP Tokens`,
    onSuccess: onSuccess,
  });

  return transaction;
};

// unstake signature: [amount]
export const useUnstakingTransaction = ({ address, onSuccess, prevStaked }) => {
  const { state } = AppStore();

  const transaction = Transaction.useTokenTransaction({
    abi: StakingRewards,
    address: prevStaked
      ? state.pool[address].oldRewardsAddress
      : state.pool[address].rewardsAddress,
    method: 'unstake',
    params: ['amount'],
    controls: {
      name: 'Unstake',
    },
    txMessage: ({ amount }) => `${units.fromWei(amount)} LINKSWAP LP Tokens`,
    onSuccess: onSuccess,
  });

  return transaction;
};

// claim all YFL & ERT
export const useClaimTransaction = ({ address, onSuccess }) => {
  const { state } = AppStore();

  const transaction = Transaction.useTokenTransaction({
    abi: StakingRewards,
    address: state.pool[address].rewardsAddress,
    method: 'claimRewards',
    controls: {
      name: 'Claim',
    },
    txMessage: () => `Claim Tokens`,
    onSuccess: onSuccess,
  });

  return transaction;
};

export const useApy = (address) => {
  const [data, setData] = useState();
  const pool = usePool(address);
  const deposited = useDeposited(address);
  const yflRate = useConversion(1, 'yfl', 'usd');
  const ertRate = useConversion(1, pool?.reward?.ert?.symbol, 'usd');
  let totalDailyRewardValue = 0;
  if(pool?.reward?.yfl?.rate > 0) {
    const dailyYflReward = format.decimals(units.fromWei(pool?.reward?.yfl?.rate) * 86400, 2);
    const dailyYflValue = dailyYflReward*yflRate;
    totalDailyRewardValue += dailyYflValue;
  }
  if(pool?.reward?.ert?.rate > 0) {
    const dailyErtReward = (pool?.reward?.ert?.symbol === 'CEL') ?
      format.decimals((pool?.reward?.ert?.rate / 10000) * 86400, 2) :
      format.decimals(units.fromWei(pool?.reward?.ert?.rate) * 86400, 2);
    const dailyErtValue = dailyErtReward*ertRate;
    if(dailyErtValue > 0) {
      totalDailyRewardValue += dailyErtValue;
    }
  }

  useEffect(() => {
    if (!!pool?.totalSupply && !!deposited) {
      const yearlyRewardsValue = totalDailyRewardValue*365;
      const perDepositedDollarYearlyReward = yearlyRewardsValue/deposited;
      const apy = perDepositedDollarYearlyReward*100;
      setData(apy);
    }
  }, [deposited, pool?.totalSupply]);

  return data;
};

