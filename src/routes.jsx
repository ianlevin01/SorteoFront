import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout/Layout.jsx';
import Home from './pages/Home.jsx';
import Raffles from './pages/Raffles.jsx';
import RaffleDetail from './pages/RaffleDetail.jsx';
import Checkout from './pages/Checkout.jsx';
import HowToParticipate from './pages/HowToParticipate.jsx';
import Winners from './pages/Winners.jsx';
import MyNumbers from './pages/MyNumbers.jsx';
import MyRaffleTickets from './pages/MyRaffleTickets.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import VerifyTicket from './pages/VerifyTicket.jsx';
import Terminos from './pages/Terminos.jsx';
import NotFound from './pages/NotFound.jsx';

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="sorteos" element={<Raffles />} />
        <Route path="sorteos/:raffleId" element={<RaffleDetail />} />
        <Route path="comprar/:orderId" element={<Checkout />} />
        <Route path="como-participar" element={<HowToParticipate />} />
        <Route path="ganadores" element={<Winners />} />
        <Route path="mis-numeros" element={<MyNumbers />} />
        <Route path="mis-numeros/:raffleId" element={<MyRaffleTickets />} />
        <Route path="ingresar" element={<Login />} />
        <Route path="registro" element={<Register />} />
        <Route path="verificar" element={<VerifyTicket />} />
        <Route path="verificar/:code" element={<VerifyTicket />} />
        <Route path="terminos" element={<Terminos />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
