# Rezdy API Integration Research Report

**Date:** 2026-01-12
**Researcher:** AI Researcher
**Status:** Complete

## Executive Summary

Rezdy provides multiple REST API products for tour/activity operators. For MVP integration, recommend **Rezdy API for Agents** (reseller model) or **RezdyConnect** (direct integration). Both support OAuth2 + API Key authentication, webhooks for real-time updates, and rate limiting of 100 calls/minute.

## Key API Products

| Product | Use Case | Best For |
|---------|----------|----------|
| **API for Agents** | Resell Rezdy supplier products | Marketplace integration |
| **RezdyConnect** | Direct supplier integration | Single-supplier MVP |
| **API for Suppliers** | Manage own inventory | Operator dashboard |

## Core Endpoints (Agents API)

```
GET /products              - Retrieve tour products
GET /availability         - Query availability by productCode, date range
POST /bookings            - Create new bookings
GET /bookings/{id}        - Fetch booking details
POST /bookings/{id}/cancel - Cancel booking
```

**Session Structure:**
- Sessions = time slots with start/end times, capacity, pricing
- Response includes: `seatsAvailable`, `totalCapacity`, `priceOptions[]`

## Authentication

**Method:** OAuth2 + Optional API Key
- **API Key Header:** `X-API-Key: {key}`
- **OAuth2:** Bearer token via Authorization header
- **Token Caching:** Rezdy caches tokens until expiration

**Setup:**
- Generate API Key from developer dashboard
- Configure OAuth2 endpoint if using token-based auth
- Support both POST and POST_X_WWW_FORM_URLENCODED for token endpoint

## Webhooks

**Events:**
- Booking created/updated/cancelled
- Availability changes
- Payment status updates

**Configuration:**
- POST request in JSON format
- Requires 2xx HTTP response
- Auto-suspended after 20+ consecutive failures
- Alert email sent on suspension

**Retry Logic:**
- Automatic retries on failure
- Manual re-activation required after suspension

## Rate Limiting & Error Handling

- **Rate Limit:** 100 calls/minute per API Key
- **Response Format:** Standard HTTP status codes
- **Error Handling:** Implement exponential backoff for retries
- **Response Type:** JSON

## Integration Best Practices

1. **Caching:** Cache product/availability data locally (refresh every 15-30 min)
2. **Rate Limiting:** Batch requests; implement client-side throttling
3. **Error Handling:** Implement 3-tier retry (exponential backoff)
4. **Webhooks:** Process async for booking notifications
5. **Testing:** Use Rezdy sandbox environment before production

## Implementation Checklist

- [ ] Register Rezdy developer account
- [ ] Generate API Key/OAuth2 credentials
- [ ] Implement authentication service
- [ ] Create tour/availability service layer
- [ ] Build booking creation/cancellation logic
- [ ] Configure webhook receiver endpoint
- [ ] Add rate limiting middleware
- [ ] Implement error handling & retry logic
- [ ] Write unit/integration tests

## Critical Dependencies

- Developer account with API access
- Supplier product codes (from Rezdy)
- Webhook endpoint URL (public, HTTPS)
- OAuth2 token endpoint (if applicable)

## Unresolved Questions

1. MVP scope: Use Agents API (marketplace) or RezdyConnect (direct)? - *Defer to planner*
2. Preferred auth: API Key or OAuth2? - *Recommend API Key for MVP simplicity*
3. Webhook event priority: Which events to handle first? - *Defer to requirements*
4. Sandbox availability: Rezdy test environment accessible? - *To be verified during setup*

## Sources

- [Rezdy Developer Portal](https://developers.rezdy.com/)
- [Rezdy API for Agents Specification](https://developers.rezdy.com/rezdyapi/index-agent.html)
- [Rezdy Webhooks Specification](https://developers.rezdy.com/rezdywebhooks/index.html)
- [RezdyConnect Specification](https://developers.rezdy.com/rezdyconnect/index.html)
- [Rezdy API Tracker](https://apitracker.io/a/rezdy)
