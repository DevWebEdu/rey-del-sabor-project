import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, CreditCard, Smartphone, Banknote, CheckCircle, User, Phone } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import CheckoutMap from '../components/CheckoutMap';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const PAYMENT_METHODS = [
  { id: 'card',     label: 'Tarjeta',  icon: <CreditCard size={20} />,  color: 'blue' },
  { id: 'yape',     label: 'Yape',     icon: <Smartphone size={20} />,  color: 'purple' },
  { id: 'plin',     label: 'Plin',     icon: <Smartphone size={20} />,  color: 'green' },
  { id: 'efectivo', label: 'Efectivo', icon: <Banknote size={20} />,    color: 'amber' },
];

export default function CheckoutPage({ onBack, onSuccess, onRegister }) {
  const { items, total, dispatch } = useCart();
  const { cliente, token }         = useAuth();
  const [step, setStep]             = useState(1);
  const [tipoEntrega, setTipoEntrega] = useState('');
  const [address, setAddress]       = useState(null);
  const [payMethod, setPayMethod]   = useState('');
  const [form, setForm]             = useState({
    name: cliente?.nombre || '', phone: '', notes: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess]       = useState(false);
  const [orderCode, setOrderCode]   = useState('');
  const [orderId, setOrderId]       = useState(null);
  const [pagoExacto, setPagoExacto] = useState(true);
  const [montoPago, setMontoPago]   = useState('');

  const MIN_ORDER     = 24;
  const delivery      = tipoEntrega === 'delivery' ? 5 : 0;
  const cardSurcharge = payMethod === 'card' ? Math.round((total + delivery) * 0.05 * 100) / 100 : 0;
  const grandTotal    = total + delivery + cardSurcharge;

  const cashInvalid = payMethod === 'efectivo' && !pagoExacto && !montoPago.trim();
  const step1Valid  = !!tipoEntrega && (tipoEntrega === 'pickup' || !!address);

  const handleSubmit = async () => {
    if (!tipoEntrega || !payMethod || !form.name || !form.phone || (tipoEntrega === 'delivery' && !address) || cashInvalid) return;
    setSubmitting(true);

    const descripcion = {
      // Datos del cliente
      nombre_cliente: form.name,
      telefono:       form.phone,
      observaciones:  form.notes || null,
      // Entrega
      tipo_entrega: tipoEntrega,
      // Pago
      tipo_pago: payMethod,
      total:     grandTotal,
      ...(cardSurcharge > 0 && { cargo_tarjeta_monto: cardSurcharge }),
      ...(payMethod === 'efectivo' && {
        pago_efectivo: {
          exacto:    pagoExacto,
          monto_con: pagoExacto ? null : `S/ ${montoPago.trim()}`,
        },
      }),
      // Dirección (solo si delivery)
      ...(tipoEntrega === 'delivery' && address
        ? { direccion: address.address, lat: address.lat, lon: address.lon }
        : {}),
      // Productos
      items: items.map(i => ({
        id:            i.id,
        name:          i.name,
        price:         i.price,
        qty:           i.qty,
        image:         i.image,
        sauces:        i.sauces,
        presaQtys:     i.presaQtys || null,
        gaseosaFlavor: i.gaseosaFlavor || null,
        complementos:  (i.complementos || []).map(c => ({ nombre: c.nombre, precio: Number(c.precio), qty: c.qty })),
        bebidas:       (i.bebidas || []).map(b => ({ nombre: b.nombre, precio: Number(b.precio), qty: b.qty, sabor: b.sabor || null })),
      })),
    };

    try {
      const montoPagoCliente = payMethod === 'efectivo' && !pagoExacto && montoPago.trim()
        ? parseFloat(montoPago.trim())
        : null;

      const res = await fetch(`${API_URL}/api/pedidos`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          nombre_cliente:     form.name,
          numero_telefonico:  form.phone,
          tipo_pago:          payMethod,
          total:              grandTotal,
          cargo_tarjeta:      payMethod === 'card' ? 1 : 0,
          tipo_entrega:       tipoEntrega === 'delivery' ? 1 : 0,
          descripcion,
          cliente_id:         cliente?.id || null,
          monto_pago_cliente: montoPagoCliente,
        }),
      });

      if (!res.ok) throw new Error('Error al enviar pedido');

      const data = await res.json();
      dispatch({ type: 'CLEAR' });
      setOrderCode(data.codigo || '');
      setOrderId(data.id || null);
      // Guardar en localStorage por si el cliente registra la cuenta más tarde
      if (!cliente) {
        localStorage.setItem('pending_order', JSON.stringify({ id: data.id, codigo: data.codigo }));
      }
      setSuccess(true);
    } catch (err) {
      alert('No se pudo enviar el pedido. Verifica que el servidor esté activo.');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center p-6 text-center"
      >
        {/* Checkmark */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: [0, 1.25, 1], opacity: 1 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6"
        >
          <motion.div
            initial={{ scale: 0, rotate: -30 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.25, duration: 0.35, ease: 'backOut' }}
          >
            <CheckCircle size={48} className="text-green-500" />
          </motion.div>
        </motion.div>

        {/* Título */}
        <motion.h2
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.4 }}
          className="text-2xl font-black text-gray-900 mb-1"
        >
          ¡Pedido confirmado!
        </motion.h2>

        <motion.p
          initial={{ y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.65, duration: 0.4 }}
          className="text-gray-500 mb-5"
        >
          Tu pedido está siendo preparado
        </motion.p>

        {/* Código de seguimiento */}
        {orderCode && (
          <motion.div
            initial={{ y: 32, opacity: 0, scale: 0.92 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            transition={{ delay: 0.85, duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
            className="relative bg-orange-50 border-2 border-orange-300 rounded-2xl px-6 py-5 mb-5 w-full max-w-xs overflow-hidden"
          >
            {/* Brillo de fondo animado */}
            <motion.div
              initial={{ x: '-100%', opacity: 0.6 }}
              animate={{ x: '200%', opacity: 0 }}
              transition={{ delay: 1.1, duration: 0.8, ease: 'easeOut' }}
              className="absolute inset-0 bg-linear-to-r from-transparent via-white/70 to-transparent skew-x-12 pointer-events-none"
            />
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-widest mb-2">
              Código de seguimiento
            </p>
            <motion.p
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 1.0, duration: 0.4, ease: 'backOut' }}
              className="text-4xl font-black text-orange-500 tracking-widest"
            >
              {orderCode}
            </motion.p>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.3, duration: 0.3 }}
              className="text-xs text-gray-400 mt-2"
            >
              Guárdalo para rastrear tu pedido
            </motion.p>
          </motion.div>
        )}

        {/* Tiempo estimado */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.4 }}
          className="text-orange-500 font-bold text-lg mb-5"
        >
          Llegará en aprox. 30-40 min 🛵
        </motion.p>

        {/* Card promo registro o ver pedidos */}
        <motion.div
          initial={{ y: 24, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          transition={{ delay: 1.4, duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
          className="w-full max-w-xs rounded-2xl overflow-hidden mb-3"
          style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 50%, #ec4899 100%)' }}
        >
          <div className="px-5 py-4">
            {cliente ? (
              <>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-2xl">📦</span>
                  <p className="text-white font-black text-base leading-tight">¡Pedido guardado en tu cuenta!</p>
                </div>
                <p className="text-purple-100 text-xs mb-3 leading-relaxed">
                  Puedes seguir el estado de tu pedido en <span className="font-bold text-white">Mis Pedidos</span> desde el menú.
                </p>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={onSuccess}
                  className="w-full bg-white text-purple-700 font-black text-sm py-2.5 rounded-xl hover:shadow-md transition-all"
                >
                  Ver mis pedidos →
                </motion.button>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-2xl">👑</span>
                  <p className="text-white font-black text-base leading-tight">¡Únete y gana recompensas!</p>
                </div>
                <p className="text-purple-100 text-xs mb-3 leading-relaxed">
                  Guarda tu historial de pedidos, acumula puntos y accede a <span className="font-bold text-white">descuentos exclusivos</span> con cada compra.
                </p>
                <div className="flex gap-1.5 mb-3">
                  {['🎁 Puntos x pedido', '📦 Historial', '🏷️ Descuentos'].map(tag => (
                    <span key={tag} className="bg-white/20 text-white text-[10px] font-semibold px-2 py-1 rounded-full whitespace-nowrap">{tag}</span>
                  ))}
                </div>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => onRegister?.(orderId)}
                  className="w-full bg-white text-purple-700 font-black text-sm py-2.5 rounded-xl hover:shadow-md transition-all"
                >
                  Crear cuenta gratis →
                </motion.button>
              </>
            )}
          </div>
        </motion.div>

        {/* Botón WhatsApp */}
        <motion.a
          href={`https://wa.me/51999999999?text=${encodeURIComponent(
            `Buenas, me pongo en contacto para consultar el estado de mi pedido con código *${orderCode}*. ¿Podrían confirmarme el tiempo estimado de entrega? Muchas gracias.`
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          initial={{ y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1.55, duration: 0.4 }}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className="flex items-center justify-center gap-2 w-full max-w-xs bg-green-500 text-white font-bold px-8 py-4 rounded-2xl hover:shadow-lg transition-all mb-3"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 shrink-0">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
            <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.12 1.532 5.845L.057 23.17a.75.75 0 0 0 .922.903l5.347-1.717A11.93 11.93 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.907 0-3.694-.512-5.228-1.405l-.374-.22-3.875 1.245 1.163-3.836-.237-.383A9.96 9.96 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
          </svg>
          Consultar estado por WhatsApp
        </motion.a>

        {/* Botón volver */}
        <motion.button
          initial={{ y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1.7, duration: 0.4 }}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={onSuccess}
          className="text-gray-400 text-sm font-semibold py-2 hover:text-gray-600 transition-colors"
        >
          Ahora no, volver al menú
        </motion.button>
      </motion.div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-50 z-50 overflow-y-auto">
      <div className={`mx-auto min-h-screen ${step === 1 ? 'max-w-4xl' : 'max-w-lg'}`}>
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 z-10 px-4 py-4 flex items-center gap-3">
          <button onClick={onBack} className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200">
            <ArrowLeft size={18} />
          </button>
          <h1 className="font-black text-gray-900 text-lg">Confirmar Pedido</h1>
        </div>

        <div className="p-4 space-y-4">
          {/* Steps */}
          <div className="flex gap-2 mb-6">
            {[1, 2, 3].map(s => (
              <div key={s} className="flex-1 flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all ${step >= s ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-400'}`}>
                  {s}
                </div>
                <div className={`flex-1 h-1 rounded-full ${s < 3 ? (step > s ? 'bg-orange-500' : 'bg-gray-200') : 'hidden'}`} />
              </div>
            ))}
          </div>

          {/* Step 1 */}
          {step === 1 && (
            <div className="fade-in-up space-y-4">

              {/* Selector tipo de entrega */}
              <div>
                <h2 className="font-bold text-gray-900 mb-3">¿Cómo quieres recibir tu pedido?</h2>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setTipoEntrega('delivery')}
                    className={`flex flex-col items-center gap-1.5 py-5 px-3 rounded-2xl border-2 font-semibold transition-all ${tipoEntrega === 'delivery' ? 'border-orange-500 bg-orange-50 text-orange-600' : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'}`}
                  >
                    <span className="text-3xl">🛵</span>
                    <span className="text-sm">Delivery</span>
                    <span className="text-xs font-normal text-gray-400">+S/ 5.00</span>
                  </button>
                  <button
                    onClick={() => setTipoEntrega('pickup')}
                    className={`flex flex-col items-center gap-1.5 py-5 px-3 rounded-2xl border-2 font-semibold transition-all ${tipoEntrega === 'pickup' ? 'border-orange-500 bg-orange-50 text-orange-600' : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'}`}
                  >
                    <span className="text-3xl">🏪</span>
                    <span className="text-sm">Recojo en tienda</span>
                    <span className="text-xs font-semibold text-green-500">Sin costo</span>
                  </button>
                </div>
              </div>

              {tipoEntrega && (
                <div className="md:grid md:grid-cols-[3fr_2fr] md:gap-6 space-y-4 md:space-y-0">

                  {/* Summary */}
                  <div className="md:order-2 space-y-4">
                    <h2 className="font-bold text-gray-900">Resumen del pedido</h2>
                    <div className="bg-white rounded-2xl p-4 space-y-3">
                      {items.map(item => {
                        const compExtras = (item.complementos || []).reduce((s, c) => s + Number(c.precio) * c.qty, 0);
                        const bebExtras  = (item.bebidas || []).reduce((s, b) => s + Number(b.precio) * b.qty, 0);
                        const itemTotal  = item.price * item.qty + compExtras + bebExtras;
                        return (
                          <div key={item.id} className="flex items-start gap-3">
                            <img src={item.image} alt={item.name} className="w-12 h-12 rounded-lg object-cover shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm text-gray-900">{item.name}</p>
                              <p className="text-gray-400 text-xs">x{item.qty}</p>
                              {item.presaQtys && (item.presaQtys.pecho > 0 || item.presaQtys.pierna > 0) && (
                                <p className="text-orange-500 text-xs font-semibold">
                                  🍗 {[
                                    item.presaQtys.pecho  > 0 && `${item.presaQtys.pecho}x Pecho`,
                                    item.presaQtys.pierna > 0 && `${item.presaQtys.pierna}x Pierna`,
                                  ].filter(Boolean).join(' · ')}
                                </p>
                              )}
                              {item.gaseosaFlavor === 'inca_kola' && <p className="text-orange-500 text-xs font-semibold">🟡 Gaseosa: Inca Kola</p>}
                              {item.gaseosaFlavor === 'coca_cola' && <p className="text-orange-500 text-xs font-semibold">🔴 Gaseosa: Coca Cola</p>}
                              {(item.complementos || []).map((c, idx) => (
                                <p key={idx} className="text-gray-400 text-xs">🍟 {c.qty}x {c.nombre}</p>
                              ))}
                              {(item.bebidas || []).map((b, idx) => (
                                <p key={idx} className="text-gray-400 text-xs">
                                  🥤 {b.qty}x {b.nombre}
                                  {b.sabor === 'inca_kola' && ' 🟡 Inca Kola'}
                                  {b.sabor === 'coca_cola' && ' 🔴 Coca Cola'}
                                </p>
                              ))}
                            </div>
                            <p className="font-bold text-gray-900 shrink-0">S/ {itemTotal.toFixed(2)}</p>
                          </div>
                        );
                      })}
                      <div className="border-t pt-3 space-y-1">
                        <div className="flex justify-between text-sm text-gray-500">
                          <span>Subtotal</span><span>S/ {total.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm text-gray-500">
                          <span>{tipoEntrega === 'pickup' ? 'Recojo en tienda' : 'Delivery'}</span>
                          <span className={tipoEntrega === 'pickup' ? 'text-green-500 font-bold' : ''}>
                            {tipoEntrega === 'pickup' ? 'Gratis' : `S/ ${delivery.toFixed(2)}`}
                          </span>
                        </div>
                        <div className="flex justify-between font-black text-gray-900 text-lg pt-1 border-t">
                          <span>Total</span><span>S/ {grandTotal.toFixed(2)}</span>
                        </div>
                        {total < MIN_ORDER && (
                          <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2 mt-2">
                            <p className="text-xs text-red-500 font-semibold text-center">
                              Pedido mínimo S/ {MIN_ORDER.toFixed(2)} — te faltan S/ {(MIN_ORDER - total).toFixed(2)}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    <button
                      disabled={!step1Valid || total < MIN_ORDER}
                      onClick={() => setStep(2)}
                      className="w-full bg-linear-to-r from-orange-500 to-red-500 text-white font-bold py-4 rounded-2xl disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-lg transition-all"
                    >
                      Continuar →
                    </button>
                  </div>

                  {/* Dirección / Recojo */}
                  <div className="md:order-1 space-y-4">
                    {tipoEntrega === 'delivery' ? (
                      <>
                        <h2 className="font-bold text-gray-900">Dirección de entrega</h2>
                        <div className="bg-white rounded-2xl p-4">
                          <CheckoutMap onAddressChange={setAddress} />
                        </div>
                      </>
                    ) : (
                      <>
                        <h2 className="font-bold text-gray-900">Información de recojo</h2>
                        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-5 space-y-3">
                          <div className="flex items-start gap-3">
                            <span className="text-2xl">📍</span>
                            <div>
                              <p className="font-bold text-gray-900">El Rey del Sabor</p>
                              <p className="text-gray-600 text-sm">Jr. Viña Lariena, Sagitario</p>
                              <p className="text-gray-600 text-sm">Santiago de Surco, Lima</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 bg-orange-100 rounded-xl px-3 py-2.5">
                            <span className="text-lg">⏱️</span>
                            <p className="text-orange-800 text-sm font-semibold">Tu pedido estará listo en aprox. 20-30 min</p>
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                </div>
              )}
            </div>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <div className="space-y-4 fade-in-up">
              <h2 className="font-bold text-gray-900">Tus datos</h2>
              <div className="bg-white rounded-2xl p-4 space-y-3">
                <div className="relative">
                  <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="text" placeholder="Nombre de quien recibirá el pedido" value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full pl-9 pr-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400"
                  />
                </div>
                <div className="relative">
                  <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="tel" placeholder="Número de contacto para comunicarse al llegar" value={form.phone}
                    onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    className="w-full pl-9 pr-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400"
                  />
                </div>
                <textarea placeholder="Indicación adicional a su pedido / preferencias" value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  rows={2}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400 resize-none"
                />
              </div>

              {address && (
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-3">
                  <p className="text-xs text-orange-700 font-semibold">📍 Entregar en:</p>
                  <p className="text-xs text-orange-600 mt-1 line-clamp-2">{address.address}</p>
                </div>
              )}

              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="flex-1 py-4 border-2 border-gray-200 rounded-2xl font-semibold text-gray-600 hover:bg-gray-50">← Atrás</button>
                <button disabled={!form.name || !form.phone} onClick={() => setStep(3)}
                  className="flex-1 bg-linear-to-r from-orange-500 to-red-500 text-white font-bold py-4 rounded-2xl disabled:opacity-40">
                  Continuar →
                </button>
              </div>
            </div>
          )}

          {/* Step 3 */}
          {step === 3 && (
            <div className="space-y-4 fade-in-up">
              <h2 className="font-bold text-gray-900">Método de pago</h2>
              <div className="grid grid-cols-2 gap-3">
                {PAYMENT_METHODS.map(m => (
                  <button key={m.id} onClick={() => { setPayMethod(m.id); setPagoExacto(true); setMontoPago(''); }}
                    className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all font-semibold text-sm ${payMethod === m.id ? 'border-orange-500 bg-orange-50 text-orange-600' : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'}`}
                  >
                    <span className={payMethod === m.id ? 'text-orange-500' : 'text-gray-400'}>{m.icon}</span>
                    {m.label}
                  </button>
                ))}
              </div>

              {payMethod === 'card' && (
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">💳</span>
                    <p className="text-blue-800 font-bold">Pago con tarjeta</p>
                  </div>
                  <p className="text-blue-600 text-sm">
                    El pago con tarjeta incluye un cargo adicional del <span className="font-bold">5%</span> sobre el subtotal + delivery.
                  </p>
                  <div className="flex justify-between items-center bg-blue-100 rounded-xl px-4 py-2.5">
                    <span className="text-blue-700 text-sm font-semibold">Cargo adicional (5%)</span>
                    <span className="text-blue-900 font-black">+S/ {cardSurcharge.toFixed(2)}</span>
                  </div>
                </div>
              )}

              {(payMethod === 'yape' || payMethod === 'plin') && (
                <div className="bg-white rounded-2xl p-6 text-center">
                  <div className="text-5xl mb-3">{payMethod === 'yape' ? '💜' : '💚'}</div>
                  <p className="font-bold text-gray-900">Pagar con {payMethod === 'yape' ? 'Yape' : 'Plin'}</p>
                  <p className="text-gray-500 text-sm mt-1">Al confirmar, recibirás el número al que yapear/plinar</p>
                  <p className="text-2xl font-black text-orange-500 mt-3">S/ {grandTotal.toFixed(2)}</p>
                </div>
              )}

              {payMethod === 'efectivo' && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-4">
                  <div>
                    <p className="text-amber-800 font-semibold">💵 Pago en efectivo</p>
                    <p className="text-amber-600 text-sm mt-0.5">El motorizado cobrará S/ {grandTotal.toFixed(2)} al entregar</p>
                  </div>

                  {/* Toggle pago exacto */}
                  <div className="flex items-center justify-between">
                    <span className="text-amber-800 text-sm font-semibold">¿Pagará con el monto exacto?</span>
                    <button
                      type="button"
                      onClick={() => { setPagoExacto(v => !v); setMontoPago(''); }}
                      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 focus:outline-none ${pagoExacto ? 'bg-amber-500' : 'bg-gray-300'}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${pagoExacto ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>

                  {/* Input monto si no es exacto */}
                  {!pagoExacto && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <label className="block text-amber-800 text-sm font-semibold mb-1">¿Con cuánto pagará?</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-700 font-bold text-sm">S/</span>
                        <input
                          type="number"
                          min={Math.ceil(grandTotal)}
                          step="1"
                          placeholder={Math.ceil(grandTotal).toString()}
                          value={montoPago}
                          onChange={e => setMontoPago(e.target.value)}
                          className="w-full pl-9 pr-4 py-3 border-2 border-amber-300 rounded-xl text-sm focus:outline-none focus:border-amber-500 bg-white text-gray-800"
                        />
                      </div>
                      {montoPago && Number(montoPago) < grandTotal && (
                        <p className="text-red-500 text-xs mt-1">El monto debe ser igual o mayor al total (S/ {grandTotal.toFixed(2)})</p>
                      )}
                    </motion.div>
                  )}
                </div>
              )}

              <div className="bg-gray-900 text-white rounded-2xl p-4">
                <p className="text-xs text-gray-400 mb-3">Resumen final</p>
                <div className="space-y-1.5 text-sm mb-3">
                  <div className="flex justify-between text-gray-300">
                    <span>Subtotal</span>
                    <span>S/ {total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-300">
                    <span>{tipoEntrega === 'pickup' ? 'Recojo en tienda' : 'Delivery'}</span>
                    <span className={tipoEntrega === 'pickup' ? 'text-green-400 font-semibold' : ''}>
                      {tipoEntrega === 'pickup' ? 'Gratis' : `S/ ${delivery.toFixed(2)}`}
                    </span>
                  </div>
                  {cardSurcharge > 0 && (
                    <div className="flex justify-between text-blue-300">
                      <span>Cargo tarjeta (5%)</span>
                      <span>+S/ {cardSurcharge.toFixed(2)}</span>
                    </div>
                  )}
                </div>
                <div className="flex justify-between font-black text-xl border-t border-gray-700 pt-2.5">
                  <span>Total a pagar</span>
                  <span className="text-orange-400">S/ {grandTotal.toFixed(2)}</span>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {tipoEntrega === 'pickup'
                    ? '🏪 Recojo en Jr. Viña Lariena, Santiago de Surco'
                    : `📍 ${address?.address?.slice(0, 55)}...`}
                </p>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep(2)} className="flex-1 py-4 border-2 border-gray-200 rounded-2xl font-semibold text-gray-600">← Atrás</button>
                <button
                  disabled={!payMethod || submitting || cashInvalid || (payMethod === 'efectivo' && !pagoExacto && !!montoPago && Number(montoPago) < grandTotal)}
                  onClick={handleSubmit}
                  className="flex-1 bg-linear-to-r from-orange-500 to-red-500 text-white font-bold py-4 rounded-2xl disabled:opacity-40 hover:shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Enviando...
                    </>
                  ) : '✓ Hacer Pedido'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
