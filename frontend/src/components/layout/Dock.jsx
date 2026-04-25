// Dock para dispositivos mobiles
// Se emplea para evitar renderizar el aside.
import logo from "../../assets/images/logo.svg";
import chat from "../../assets/images/chat.svg";
import search from "../../assets/images/search.svg";
import settings from "../../assets/images/settings.svg";
import auth from "../../assets/images/auth.svg";

import Button from "./Button";

export default function Dock() {
  return (
    <div className="fixed bottom-0 w-full flex justify-around bg-gray-900 p-2">
      <Button icon={logo} variant="dock">
        
      </Button>

      <Button icon={chat} variant="dock">
        
      </Button>

      <Button icon={search} variant="dock">
        
      </Button>

      <Button icon={settings} variant="dock">
        
      </Button>

      <Button icon={auth} variant="dock">
        
      </Button>
    </div>
  );
}