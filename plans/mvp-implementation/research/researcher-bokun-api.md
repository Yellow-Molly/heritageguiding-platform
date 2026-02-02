# Bokun API Research Report

## Authentication

**Method:** API Key-based (access key + secret key)
- Keys scoped to "booking channel" (required setup before API access)
- Permissions configured per API key for specific actions
- Test endpoint: `https://api.bokuntest.com`
- Production endpoint: `https://api.bokun.io`

**Headers:** Standard API key signature header (HMAC-based)

## Key Endpoints

### Availability & Pricing
- `GET /restapi/v2.0/activity/{id}/availabilities` - Fetch sessions with pricing, availability count, minParticipants
- `GET /restapi/v2.0/allocations` - Paginated allocation retrieval
- `GET /restapi/v2.0/startTime/{startTimeId}` - Single session details

**Response includes:** date, startTime, startTimeId, availabilityCount, bookedParticipants, rates[]

### Booking
- `POST /restapi/v2.0/booking` - Create booking (direct) or add to cart
- `GET /restapi/v2.0/booking/{bookingId}` - Retrieve booking
- `GET /restapi/v2.0/booking/{bookingId}/payments` - Fetch payments
- `GET /restapi/v2.0/booking/{bookingId}/invoices` - Fetch invoices

**Booking methods:**
1. Single request with all products → checkout
2. Add products to cart incrementally → checkout

## Data Structures

```typescript
interface Availability {
  date: string;
  startTime: string;
  startTimeId: string;
  unlimitedAvailability: boolean;
  availabilityCount: number;
  bookedParticipants: number;
  minParticipants: number;
  rates: Rate[];
}

interface Rate {
  participantCount: number;
  ageBand?: string;
  price: string; // Always string, never float
  currency: string;
}

interface Booking {
  id: string;
  customerDetails: {
    name: string;
    email: string;
    phone: string;
  };
  productBookings: ProductBooking[];
  totalPrice: string; // String format
}

interface ProductBooking {
  startTimeId: string;
  participants: Participant[];
  notes?: string;
}
```

**Critical:** Always use strings for monetary amounts, UTC milliseconds for timestamps.

## Webhooks

**Supported events:**
- Booking created/confirmed
- Booking status changes
- Payment updates

**Setup:** Configure webhook endpoint URL in dashboard; receives POST requests with booking event payloads

## Rate Limits

- **400 requests/minute** per vendor (regardless of API key)
- **Response:** `429 Too Many Requests` with `Retry-After` header (seconds to wait)
- **Caching:** Implement exponential backoff + local cache for availability queries

## Comparison vs Rezdy

| Feature | Bokun | Rezdy |
|---------|-------|-------|
| Auth | API key + secret | API key only |
| Booking Channel | Required per integration | Not required |
| Rate Limit | 400/min per vendor | TBD (research needed) |
| Monetary Format | String required | TBD |
| Webhook Support | Yes, event-driven | TBD |
| Session Data | startTimeId-based | Product ID-based |

## Implementation Priority

1. **Auth handler** - Signature generation (HMAC)
2. **Availability query** - Cache with TTL (30-60s)
3. **Booking creation** - Cart or direct method
4. **Webhook receiver** - Event validation & processing
5. **Error handling** - 429 retry logic

## Documentation Links

- [Authentication & Setup](https://bokun.dev/booking-api-rest/vU6sCfxwYdJWd1QAcLt12i/configuring-the-platform-for-api-usage-and-authentication/sFiGRpo4detkmrZPcWtQPj)
- [Booking Process](https://bokun.dev/booking-api-rest/vU6sCfxwYdJWd1QAcLt12i/booking-process/7ce3yQRdURnCYQkhJsi2op)
- [Webhooks](https://bokun.dev/webhooks/g3YWZ24sADsceKK5vqrMzZ)
- [API Docs v2](https://api-docs.bokun.dev/rest-v2)
- [Swagger YAML](https://api-docs.bokun.dev/rest-v2.yaml)

---

**Unresolved Questions:**
- HMAC signature algorithm details (SHA256?)
- Webhook signature validation method
- Exact permission scope options
- Product bundle support
- Custom questions in booking flow
