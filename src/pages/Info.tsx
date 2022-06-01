import { useContext } from '../contexts';
import FinanceInformation from '../old-components/FinanceInformation';
import GovernanceInformation from '../old-components/GovernanceInformation';
import PermissionsInformation from '../old-components/PermissionsInformation';
import SchemesInformation from '../old-components/SchemesInformation';
import { Box, LinkButton } from '../old-components/common';
import { useLocation } from 'react-router-dom';
import styled from 'styled-components';

const InfoPageWrapper = styled(Box)`
  width: 100%;
`;

const InfoNavigation = styled.div`
  padding: 0px 10px 10px 10px;
  color: var(--dark-text-gray);
  border-bottom: 1px solid var(--line-gray);
  font-weight: 500;
  font-size: 18px;
  letter-spacing: 1px;
  display: flex;
  justify-content: space-around;
  flex-direction: row;
`;
const InfoPage = () => {
  const {
    context: { configStore },
  } = useContext();
  const networkName = configStore.getActiveChainName();
  const searchPath = useLocation().search;
  return (
    <InfoPageWrapper>
      <InfoNavigation>
        <LinkButton route={`/${networkName}/info?view=governance`}>
          Governance
        </LinkButton>
        <LinkButton route={`/${networkName}/info?view=finance`}>
          Finance
        </LinkButton>
        <LinkButton route={`/${networkName}/info?view=schemes`}>
          Schemes
        </LinkButton>
        <LinkButton route={`/${networkName}/info?view=permissions`}>
          Permissions
        </LinkButton>
      </InfoNavigation>
      <div>
        {searchPath === `?view=schemes` ? (
          <SchemesInformation />
        ) : searchPath === `?view=governance` ? (
          <GovernanceInformation />
        ) : searchPath === `?view=permissions` ? (
          <PermissionsInformation />
        ) : (
          <FinanceInformation />
        )}
      </div>
    </InfoPageWrapper>
  );
};

export default InfoPage;
