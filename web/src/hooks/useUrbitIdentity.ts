import { useEffect, useState } from "react";
import { discoverUrbitIdentity, getUrbitIdentity, onUrbitIdentityChange } from "@/api/urbit";

export function useUrbitIdentity() {
  const [identity, setIdentity] = useState(getUrbitIdentity);

  useEffect(() => {
    const refresh = () => setIdentity(getUrbitIdentity());
    const unsubscribe = onUrbitIdentityChange(refresh);

    void discoverUrbitIdentity().then(refresh);
    return unsubscribe;
  }, []);

  return identity;
}
