import React from 'react';
import styled from 'styled-components';
import {
  Button,
  Countdown,
  LazyBoi,
  Modal,
  Panel,
  Stat,
  Status,
} from '@components';
import { Pool, Account } from '@archetypes';
import { useBit } from '@util/hooks';
import { units, format } from '@util/helpers';
import { ReactComponent as IconChevron } from '@icon/chevron_down.svg';
import { ReactComponent as LogoYFLink } from '@logo/yflink.svg';
import { ReactComponent as LogoMetaMask } from '@logo/metamask.svg';

const LoadingPosition = ({ className }) => (
  <Panel className={className}>
    <Status
      icon={<LogoYFLink animate='logospin' />}
      title='Loading position'
      info='Loading your position in this pool'
      //link={<a href="https://etherscan.io" target="_blank">View transaction</a>}
      small
    />
  </Panel>
);

const NoPosition = ({ address, className }) => {
  const pool = Pool.usePool(address);

  return (
    <Panel
      className={className}
      subtitle='Get started by acquiring LINKSWAP Liquidity tokens'
      loose
    >
      <p>
        LINKSWAP LP tokens are required. Once you've added liquidity to the{' '}
        {pool?.token0?.symbol}-{pool?.token1?.symbol} pool you can stake your
        liquidity tokens on this page.
      </p>
      <Button
        status='neutral'
        href={pool?.liqudityUrl}
        target='_blank'
        rel='noopener noreferrer'
      >
        Add {`${pool?.token0?.symbol}-${pool?.token1?.symbol}`} liquidity
      </Button>
    </Panel>
  );
};

const HasPosition = styled(({ address, className }) => {
  const { usePosition } = Pool;

  const position = usePosition(address);
  const pool = Pool.usePool(address);
  const hasYFLRewards = pool?.reward?.yfl?.rate !== '0';

  return (
    <Panel className={className}>
      <span>
        <Stat
          title='LINKSWAP LP Balance'
          // info={`≈ ${format.currency(fiat_balance)}`}
          large
        >
          <LazyBoi
            value={position?.balance}
            format={(val) => format.maxDB(units.fromWei(val), 5)}
          />
        </Stat>
        <Button onClick={() => Modal.open(<Pool.Stake address={address} />)}>
          Stake
        </Button>
      </span>
      <span>
        <Stat
          title='Currently Staked'
          //info={`≈ ${format.currency(fiat_staked)}`}
          large
        >
          <LazyBoi
            value={position?.staked}
            format={(val) => format.maxDB(units.fromWei(val), 7)}
          />
        </Stat>
        <Button
          disabled={!+position?.staked}
          onClick={() => Modal.open(<Pool.Unstake address={address} />)}
        >
          Unstake
        </Button>
      </span>
      {pool?.address === '0xf68c01198cDdEaFB9d2EA43368FC9fA509A339Fa' && ( // Show previously staked amount for CFI/LINK pool
        <span>
          <Stat
            title='Previously Staked'
            //info={`≈ ${format.currency(fiat_staked)}`}
            prevStaked={true}
            large
          >
            <LazyBoi
              value={position?.oldStaked}
              format={(val) => format.maxDB(units.fromWei(val), 5)}
            />
          </Stat>
          <Button
            className='prev-unstake'
            disabled={!+position?.oldStaked}
            onClick={() =>
              Modal.open(<Pool.Unstake address={address} prevStaked={true} />)
            }
          >
            Unstake
          </Button>
        </span>
      )}
      {hasYFLRewards && (
        <span>
          <Stat
            title='Unclaimed YFL'
            //info={`≈ ${format.currency(fiat_rewards_yfl)}`}
            large
          >
            <LazyBoi
              value={position?.reward?.yfl}
              format={(val) => format.maxDB(units.fromWei(val), 5)}
            />
          </Stat>
          <Button
            disabled={!+position?.reward?.yfl}
            onClick={() => Modal.open(<Pool.Claim address={address} />)}
          >
            {position?.reward?.ert ? 'Claim All' : 'Claim'}
          </Button>
        </span>
      )}
      {pool?.reward?.ert?.symbol && (
        <span>
          <Stat
            title={`Unclaimed ${pool?.reward?.ert?.symbol}`}
            //info={`≈ ${format.currency(fiat_rewards_ert)}`}
            large
          >
            <LazyBoi
              value={position?.reward?.ert}
              format={(val) => {
                if (pool?.reward?.ert?.symbol === 'CEL') {
                  return format.maxDB(val / 10000, 5);
                }
                return format.maxDB(units.fromWei(val), 5);
              }}
            />
          </Stat>
          <Button
            disabled={!+position?.reward?.ert}
            onClick={() => Modal.open(<Pool.Claim address={address} />)}
          >
            {position?.reward?.ert ? 'Claim All' : 'Claim'}
          </Button>
        </span>
      )}
    </Panel>
  );
})`
  .panel-content {
    flex-grow: 1;
    display: flex;
    justify-content: space-between;
    align-items: flex-end;

    > span {
      width: 33%;
      height: 100%;

      .prev-unstake {
        color: #ff3532;
      }
    }
  }
  
  @media (max-width: 770px) {
    .panel-content {
      flex-wrap: wrap;
      > span {
        display: flex;
        flex: 0 0 100%;
        width: 100%;
        flex-direction: column;
        margin-bottom: 2rem;
      }
    }
  }
  
  .button {
    margin-top: 1rem;
  }
`;

const NotConnected = styled(({ className }) => (
  <Panel className={className} loose>
    <Status
      icon={<LogoMetaMask defaultcolor='true' />}
      title='Not Connected'
      info='Connect metamask to view your position'
      link={<Account.Button compact text='Connect Metamask' />}
      small
    />
  </Panel>
))`
  .panel-content {
    display: flex;
    justify-content: center;
    align-items: flex-start;

    .status {
      display: inline-flex;
      margin: 0 auto;
      width: auto;
    }
  }
`;

const UserPositionPanel = styled(({ address, open, className }) => {
  const connected = Account.useConnected();
  const position = Pool.usePosition(address);

  if (connected) {
    return !position ? (
      <LoadingPosition className={className} />
    ) : position?.balance > 0 ||
    position?.staked > 0 ||
    position?.reward?.yfl > 0 ||
    position?.reward?.ert > 0 ? (
      <HasPosition address={address} className={className} />
    ) : (
      <NoPosition address={address} className={className} />
    );
  } else {
    return <NotConnected className={className} />;
  }
})`
  overflow: hidden;
  background: rgba(0, 0, 0, 0.3) !important;
  margin-top: 2rem;
  transition: all 0.15s;
  opacity: 1;

  ${({ open }) =>
  !open &&
  `
			max-height: 0rem;
			padding: 0;
			margin: 0;
			opacity: 0;
		`}
`;

export default styled(({ address, className, yfl }) => {
  const [open, toggleOpen] = useBit();

  const pool = Pool.usePool(address);
  const deposited = Pool.useDeposited(address);
  const stake = Pool.useUserStake(address);
  const apy = Pool.useApy(address);
  const hasYFLRewards = pool?.reward?.yfl?.rate !== '0';

  return (
    <Panel className={`pool-row ${className}`} data-open={open}>
      <div className={'pool-details'} onClick={() => toggleOpen()}>
        <span className='title-col'>
          {Boolean(apy) ? (
            <Pool.Name address={address} apy={'APY: ~'+format.decimals(apy, 2)+'%'}/>
          ) : (
            <Pool.Name address={address} />
          )}

          <Stat inline small light className='countdown'>
            <Countdown prefix='Ends in: ' to={pool?.periodFinish} />
          </Stat>
        </span>

        <span className='stats-group'>
          <span>
            <Stat title='Total Deposited'>
              <LazyBoi
                value={deposited}
                format={(val) => format.currency(val)}
              />
            </Stat>
          </span>
          <span>
            <Stat title='Pool Rate'>
              <div>
                {hasYFLRewards && (
                  <LazyBoi
                    value={pool?.reward?.yfl?.rate}
                    format={(val) =>
                      format.decimals(units.fromWei(val) * 86400, 2)
                    }
                    suffix={<span className='suffix'> YFL/day</span>}
                  />
                )}
              </div>
              {pool?.reward?.ert && (
                <div>
                  <LazyBoi
                    value={pool?.reward?.ert?.rate}
                    format={(val) => {
                      if (pool?.reward?.ert?.symbol === 'CEL') {
                        return format.decimals((val / 10000) * 86400, 2);
                      }
                      return format.decimals(units.fromWei(val) * 86400, 2);
                    }}
                    suffix={
                      <span className='suffix'>
                        {`${pool?.reward?.ert?.symbol}/day`}
                      </span>
                    }
                  />
                </div>
              )}
            </Stat>
          </span>
          <span>
            <Stat title='My Stake'>
              <LazyBoi value={stake} format={(val) => format.currency(val)} />
            </Stat>
          </span>
        </span>

        <span>
          <Button.Icon
            icon={<IconChevron />}
            className='toggle'
            onClick={() => toggleOpen()}
          />
        </span>
      </div>
      <UserPositionPanel address={address} open={open} />
    </Panel>
  );
})`
  transition: all 0.25s ease-in-out;
  z-index: 1;

  .pool-details {
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    cursor: pointer;
    //margin-top: 1rem;

    .title-col {
      width: 50%;

      .pool-name {
        padding: 1.8rem 2.4rem 1.8rem 2rem;
        background: rgba(255, 255, 255, 0.1);
        margin-bottom: 0.9rem;
        display: inline-flex;
      }

      .countdown {
        text-align: center;
      }
    }

    .stats-group {
      justify-content: flex-start;
      align-items: flex-start;
      width: 100%;
      display: flex;

      > span {
        margin-left: 20px;
        margin-bottom: 20px;
        float: left; 
        flex: 0 0 150px;
        
        &:last-child {
          float: right;
          margin: 0 20px 20px;
          flex: 1;
        }
      }
    }

    .suffix {
      font-size: 0.8em;
      opacity: 0.5;
      font-weight: 400;
    }

    &:hover .toggle {
      opacity: 1;
    }
  }

  .toggle {
    opacity: 0.7;
    transition: opacity 0.2s;
    transform: rotate(180deg);
    &:hover {
      opacity: 1;
    }
  }

  &[data-open='false'] {
    .toggle {
      transform: rotate(0deg);
    }
  }

  &[data-open='true'],
  &:hover {
    z-index: 2;
    background: #445363;
  }

  @media (max-width: 850px) {
    .pool-details {
      .stats-group {
        width: 100%;
        display: block;
  
        > span {
          margin-left: 20px;
          margin-bottom: 20px;
          float: left;
          
          &:last-child {
            float: left;
            margin: 0 0 20px 20px;
          }
        }
      }
    }
  }

  @media (max-width: 500px) {
    .pool-details {
      flex-wrap: wrap;
      .title-col {
        display: flex;
        flex: 0 0 100%;
        justify-content: center;
        width: 100%;
        flex-wrap: wrap;
        margin: 0 0 2em;
      }    
      
      .pool-name {
        width: 100%;
      }
      
      .stats-group {
        flex-wrap: wrap;
        
        > span {
          width: 100%;
          margin: 0 0 20px;
          
          &:last-child {
            float: left;
            margin: 0 0 20px;
          }
        }
      }
      
      .button-action, .lazyboi {
        display: none;
      }
    }
  }
`;
