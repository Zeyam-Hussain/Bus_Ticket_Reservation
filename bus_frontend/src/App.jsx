import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Index from './components/Index';
import Login from './components/Login';
import Signup from './components/Signup';
import VerifyEmail from './components/VerifyEmail';
import Book from './components/Book';
import AccountSettings from './components/AccountSettings';
import BookResult from './components/BookResult';
import SeatSelection from './components/SeatSelection';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Signup />} />
        <Route path="/verify-otp" element={<VerifyEmail />} />
        <Route path="/book" element={<Book />} />
        <Route path="/account-settings" element={<AccountSettings />} />
        <Route path="/book-result" element={<BookResult />} />
        <Route path="/seat-selection" element={<SeatSelection />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
