import request from "supertest";
import app from "../../src/app";
import prisma from "../../src/libs/prisma";

describe("Poll API", () => {
  beforeEach(async () => {
    await prisma.availability.deleteMany();
    await prisma.participant.deleteMany();

    await prisma.poll.updateMany({
      data: {
        finalTimeOptionId: null,
      },
    });

    await prisma.timeOption.deleteMany();
    await prisma.poll.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

describe("GET /api/health", () => {
      it("returns API health status", async () => {
        const response = await request(app)
          .get("/api/health")
          .expect(200);
    
        expect(response.body).toEqual({
          status: "OK",
          message: "Server is running",
        });
      });
    
      // Add it here
      it("returns security headers", async () => {
        const response = await request(app)
          .get("/api/health")
          .expect(200);
    
        expect(response.headers).toHaveProperty(
          "x-content-type-options",
          "nosniff"
        );
    
        expect(response.headers).toHaveProperty(
          "x-frame-options"
        );
    
        expect(response.headers).toHaveProperty(
          "content-security-policy"
        );
      });
});


describe("CORS security", () => {
          it("allows the configured frontend origin", async () => {
            const response = await request(app)
              .get("/api/health")
              .set("Origin", "http://localhost:3000")
              .expect(200);
        
            expect(
              response.headers["access-control-allow-origin"]
            ).toBe("http://localhost:3000");
          });
});

describe("CORS security2", () => {
    it("does not allow an untrusted origin", async () => {
          const response = await request(app)
            .get("/api/health")
            .set("Origin", "https://evil.example");
        
          expect(
            response.headers["access-control-allow-origin"]
          ).toBeUndefined();
        });
});

describe("Request size limits", () => {
      it("rejects oversized JSON bodies", async () => {
        const oversizedDescription =
          "a".repeat(1_100_000);
    
        await request(app)
          .post("/api/polls")
          .send({
            title: "Oversized Request",
            description: oversizedDescription,
            timezone: "America/Edmonton",
            options: [
              {
                startTime: "2026-10-20T16:00:00.000Z",
                endTime: "2026-10-20T16:30:00.000Z",
              },
            ],
          })
          .expect(413);
            const response = await request(app)
              .post("/api/polls")
              .send({
                title: "Oversized Request",
                description: oversizedDescription,
                timezone: "America/Edmonton",
                options: [
                  {
                    startTime: "2026-10-20T16:00:00.000Z",
                    endTime: "2026-10-20T16:30:00.000Z",
                  },
                ],
              })
              .expect(413);

            expect(response.body).toEqual({
              message: "Request body is too large",
            });
      });
});

describe("Error handling", () => {
      it("returns JSON for invalid JSON bodies", async () => {
        const response = await request(app)
          .post("/api/polls")
          .set("Content-Type", "application/json")
          .send('{"title":')
          .expect(400);
    
        expect(response.body).toEqual({
          message: "Invalid JSON body",
        });
      });
});

describe("Rate limiting", () => {
      it("returns rate limit headers", async () => {
        const response = await request(app)
          .get("/api/health")
          .expect(200);
    
        expect(response.headers).toHaveProperty(
          "ratelimit"
        );
      });
});

describe("POST /api/polls", () => {
    it("creates a poll", async () => {
      const response = await request(app)
        .post("/api/polls")
        .send({
          title: "Engineering Meeting",
          description: "Discuss the next release",
          timezone: "America/Edmonton",
          options: [
            {
              startTime: "2026-09-10T16:00:00.000Z",
              endTime: "2026-09-10T16:30:00.000Z",
            },
            {
              startTime: "2026-09-11T17:00:00.000Z",
              endTime: "2026-09-11T17:30:00.000Z",
            },
          ],
        })
        .expect(201);

      expect(response.body).toMatchObject({
        title: "Engineering Meeting",
        description: "Discuss the next release",
        timezone: "America/Edmonton",
        status: "OPEN",
      });

      expect(response.body.publicId).toEqual(
        expect.any(String)
      );

      expect(response.body.organizerToken).toEqual(
        expect.any(String)
      );

      expect(response.body.timeOptions).toHaveLength(2);
    });
});


describe("GET /api/polls/:publicId", () => {
      it("returns the poll without exposing organizerToken", async () => {
        const createResponse = await request(app)
          .post("/api/polls")
          .send({
            title: "Security Test Meeting",
            description: "Verify private fields stay private",
            timezone: "America/Edmonton",
            options: [
              {
                startTime: "2026-09-12T16:00:00.000Z",
                endTime: "2026-09-12T16:30:00.000Z",
              },
            ],
          })
          .expect(201);
    
        const publicId = createResponse.body.publicId;
    
        const getResponse = await request(app)
          .get(`/api/polls/${publicId}`)
          .expect(200);
    
        expect(getResponse.body.title).toBe(
          "Security Test Meeting"
        );
    
        expect(getResponse.body).not.toHaveProperty(
          "organizerToken"
        );
      });
});


describe("Participant responses", () => {
          it("creates a participant but does not expose responseToken through public GET", async () => {
            // Create poll
            const pollResponse = await request(app)
              .post("/api/polls")
              .send({
                title: "Participant Security Test",
                description: "Test participant token privacy",
                timezone: "America/Edmonton",
                options: [
                  {
                    startTime: "2026-09-15T16:00:00.000Z",
                    endTime: "2026-09-15T16:30:00.000Z",
                  },
                  {
                    startTime: "2026-09-16T17:00:00.000Z",
                    endTime: "2026-09-16T17:30:00.000Z",
                  },
                ],
              })
              .expect(201);
        
            const publicId = pollResponse.body.publicId;
            const timeOptionId =
              pollResponse.body.timeOptions[0].id;
        
            // Submit participant availability
            const participantResponse = await request(app)
              .post(`/api/polls/${publicId}/responses`)
              .send({
                name: "James",
                responses: [
                  {
                    timeOptionId,
                    status: "AVAILABLE",
                  },
                ],
              })
              .expect(201);
        
            // Private token SHOULD be returned to James here
            expect(participantResponse.body.responseToken).toEqual(
              expect.any(String)
            );
        
            expect(participantResponse.body.name).toBe("James");
        
            // Publicly retrieve poll
            const publicResponse = await request(app)
              .get(`/api/polls/${publicId}`)
              .expect(200);
        
            expect(publicResponse.body.participants).toHaveLength(1);
        
            const participant =
              publicResponse.body.participants[0];
        
            expect(participant.name).toBe("James");
        
            // Private token MUST NOT be publicly exposed
            expect(participant).not.toHaveProperty(
              "responseToken"
            );
        
            expect(participant.availabilities).toHaveLength(1);
        
            expect(participant.availabilities[0]).toMatchObject({
              timeOptionId,
              status: "AVAILABLE",
            });
          });
});


describe("Participant response validation", () => {
          it("rejects a time option that belongs to another poll", async () => {
            const pollA = await request(app)
              .post("/api/polls")
              .send({
                title: "Poll A",
                timezone: "America/Edmonton",
                options: [
                  {
                    startTime: "2026-09-20T16:00:00.000Z",
                    endTime: "2026-09-20T16:30:00.000Z",
                  },
                ],
              })
              .expect(201);
        
            const pollB = await request(app)
              .post("/api/polls")
              .send({
                title: "Poll B",
                timezone: "America/Edmonton",
                options: [
                  {
                    startTime: "2026-09-21T16:00:00.000Z",
                    endTime: "2026-09-21T16:30:00.000Z",
                  },
                ],
              })
              .expect(201);
        
            const foreignTimeOptionId =
              pollB.body.timeOptions[0].id;
        
            const response = await request(app)
              .post(`/api/polls/${pollA.body.publicId}/responses`)
              .send({
                name: "Sarah",
                responses: [
                  {
                    timeOptionId: foreignTimeOptionId,
                    status: "AVAILABLE",
                  },
                ],
              })
              .expect(400);
        
            expect(response.body).toEqual({
              message:
                "One or more time options do not belong to this poll",
            });
          });
        
          it("rejects responses when the poll is closed", async () => {
            const poll = await request(app)
              .post("/api/polls")
              .send({
                title: "Closed Poll",
                timezone: "America/Edmonton",
                options: [
                  {
                    startTime: "2026-09-22T16:00:00.000Z",
                    endTime: "2026-09-22T16:30:00.000Z",
                  },
                ],
              })
              .expect(201);
        
            await request(app)
              .patch(`/api/polls/${poll.body.publicId}`)
              .set(
                "X-Organizer-Token",
                poll.body.organizerToken
              )
              .send({
                status: "CLOSED",
              })
              .expect(200);
        
            const response = await request(app)
              .post(`/api/polls/${poll.body.publicId}/responses`)
              .send({
                name: "James",
                responses: [
                  {
                    timeOptionId: poll.body.timeOptions[0].id,
                    status: "AVAILABLE",
                  },
                ],
              })
              .expect(409);
        
            expect(response.body).toEqual({
              message: "This poll is no longer accepting responses",
            });
          });
});


describe("PATCH participant response", () => {
          it("updates an existing participant without creating a duplicate", async () => {
            const poll = await request(app)
              .post("/api/polls")
              .send({
                title: "Update Response Test",
                timezone: "America/Edmonton",
                options: [
                  {
                    startTime: "2026-09-25T16:00:00.000Z",
                    endTime: "2026-09-25T16:30:00.000Z",
                  },
                  {
                    startTime: "2026-09-26T17:00:00.000Z",
                    endTime: "2026-09-26T17:30:00.000Z",
                  },
                ],
              })
              .expect(201);
        
            const firstOptionId = poll.body.timeOptions[0].id;
            const secondOptionId = poll.body.timeOptions[1].id;
        
            const participant = await request(app)
              .post(`/api/polls/${poll.body.publicId}/responses`)
              .send({
                name: "James",
                responses: [
                  {
                    timeOptionId: firstOptionId,
                    status: "AVAILABLE",
                  },
                ],
              })
              .expect(201);
        
            const participantId = participant.body.id;
            const responseToken = participant.body.responseToken;
        
            const updateResponse = await request(app)
              .patch(
                `/api/polls/${poll.body.publicId}/responses/${responseToken}`
              )
              .send({
                responses: [
                  {
                    timeOptionId: firstOptionId,
                    status: "UNAVAILABLE",
                  },
                  {
                    timeOptionId: secondOptionId,
                    status: "AVAILABLE",
                  },
                ],
              })
              .expect(200);
        
            expect(updateResponse.body.id).toBe(participantId);
        
            expect(updateResponse.body.availabilities).toEqual(
              expect.arrayContaining([
                expect.objectContaining({
                  timeOptionId: firstOptionId,
                  status: "UNAVAILABLE",
                }),
                expect.objectContaining({
                  timeOptionId: secondOptionId,
                  status: "AVAILABLE",
                }),
              ])
            );
        
            const participantCount =
              await prisma.participant.count();
        
            expect(participantCount).toBe(1);
          });
        
          it("rejects an invalid response token", async () => {
            const poll = await request(app)
              .post("/api/polls")
              .send({
                title: "Invalid Token Test",
                timezone: "America/Edmonton",
                options: [
                  {
                    startTime: "2026-09-27T16:00:00.000Z",
                    endTime: "2026-09-27T16:30:00.000Z",
                  },
                ],
              })
              .expect(201);
        
            const response = await request(app)
              .patch(
                `/api/polls/${poll.body.publicId}/responses/invalid-token`
              )
              .send({
                responses: [
                  {
                    timeOptionId: poll.body.timeOptions[0].id,
                    status: "AVAILABLE",
                  },
                ],
              })
              .expect(404);
        
            expect(response.body).toEqual({
              message: "Participant response not found",
            });
          });
});


describe("Organizer authorization", () => {
          it("rejects poll updates without an organizer token", async () => {
            const poll = await request(app)
              .post("/api/polls")
              .send({
                title: "Organizer Auth Test",
                timezone: "America/Edmonton",
                options: [
                  {
                    startTime: "2026-10-01T16:00:00.000Z",
                    endTime: "2026-10-01T16:30:00.000Z",
                  },
                ],
              })
              .expect(201);
        
            const response = await request(app)
              .patch(`/api/polls/${poll.body.publicId}`)
              .send({
                title: "Unauthorized Change",
              })
              .expect(401);
        
            expect(response.body).toEqual({
              message: "Organizer token is required",
            });
          });
        
          it("rejects an incorrect organizer token", async () => {
            const poll = await request(app)
              .post("/api/polls")
              .send({
                title: "Wrong Token Test",
                timezone: "America/Edmonton",
                options: [
                  {
                    startTime: "2026-10-02T16:00:00.000Z",
                    endTime: "2026-10-02T16:30:00.000Z",
                  },
                ],
              })
              .expect(201);
        
            const response = await request(app)
              .patch(`/api/polls/${poll.body.publicId}`)
              .set("X-Organizer-Token", "wrong-token")
              .send({
                title: "Unauthorized Change",
              })
              .expect(403);
        
            expect(response.body).toEqual({
              message: "Not authorized to modify this poll",
            });
          });
        
          it("allows the organizer to update the poll", async () => {
            const poll = await request(app)
              .post("/api/polls")
              .send({
                title: "Original Title",
                timezone: "America/Edmonton",
                options: [
                  {
                    startTime: "2026-10-03T16:00:00.000Z",
                    endTime: "2026-10-03T16:30:00.000Z",
                  },
                ],
              })
              .expect(201);
        
            const response = await request(app)
              .patch(`/api/polls/${poll.body.publicId}`)
              .set(
                "X-Organizer-Token",
                poll.body.organizerToken
              )
              .send({
                title: "Updated Title",
                status: "CLOSED",
              })
              .expect(200);
        
            expect(response.body).toMatchObject({
              title: "Updated Title",
              status: "CLOSED",
            });
        
            expect(response.body).not.toHaveProperty(
              "organizerToken"
            );
          });
});


describe("Poll finalization", () => {
          it("finalizes a time option that belongs to the poll", async () => {
            const poll = await request(app)
              .post("/api/polls")
              .send({
                title: "Finalize Test",
                timezone: "America/Edmonton",
                options: [
                  {
                    startTime: "2026-10-05T16:00:00.000Z",
                    endTime: "2026-10-05T16:30:00.000Z",
                  },
                  {
                    startTime: "2026-10-06T17:00:00.000Z",
                    endTime: "2026-10-06T17:30:00.000Z",
                  },
                ],
              })
              .expect(201);
        
            const selectedOption =
              poll.body.timeOptions[0];
        
            const response = await request(app)
              .post(
                `/api/polls/${poll.body.publicId}/finalize`
              )
              .set(
                "X-Organizer-Token",
                poll.body.organizerToken
              )
              .send({
                timeOptionId: selectedOption.id,
              })
              .expect(200);
        
            expect(response.body).toMatchObject({
              status: "FINALIZED",
              finalTimeOptionId: selectedOption.id,
            });
        
            expect(response.body.finalTimeOption).toMatchObject({
              id: selectedOption.id,
              startTime: selectedOption.startTime,
              endTime: selectedOption.endTime,
            });
          });
        
          it("rejects finalizing a time option from another poll", async () => {
            const pollA = await request(app)
              .post("/api/polls")
              .send({
                title: "Finalize Poll A",
                timezone: "America/Edmonton",
                options: [
                  {
                    startTime: "2026-10-07T16:00:00.000Z",
                    endTime: "2026-10-07T16:30:00.000Z",
                  },
                ],
              })
              .expect(201);
        
            const pollB = await request(app)
              .post("/api/polls")
              .send({
                title: "Finalize Poll B",
                timezone: "America/Edmonton",
                options: [
                  {
                    startTime: "2026-10-08T16:00:00.000Z",
                    endTime: "2026-10-08T16:30:00.000Z",
                  },
                ],
              })
              .expect(201);
        
            const response = await request(app)
              .post(
                `/api/polls/${pollA.body.publicId}/finalize`
              )
              .set(
                "X-Organizer-Token",
                pollA.body.organizerToken
              )
              .send({
                timeOptionId: pollB.body.timeOptions[0].id,
              })
              .expect(400);
        
            expect(response.body).toEqual({
              message:
                "Selected time option does not belong to this poll",
            });
          });
});


describe("Poll validation", () => {
          it("rejects poll creation with missing required fields", async () => {
            const response = await request(app)
              .post("/api/polls")
              .send({
                description: "Missing required fields",
              })
              .expect(400);
        
            expect(response.body.message).toBe(
              "Invalid poll data"
            );
          });
        
          it("rejects a poll where endTime is before startTime", async () => {
            const response = await request(app)
              .post("/api/polls")
              .send({
                title: "Invalid Time Test",
                timezone: "America/Edmonton",
                options: [
                  {
                    startTime: "2026-10-10T17:00:00.000Z",
                    endTime: "2026-10-10T16:00:00.000Z",
                  },
                ],
              })
              .expect(400);
        
            expect(response.body.message).toBe(
              "Invalid poll data"
            );
          });
        
          it("returns 404 for a nonexistent poll", async () => {
            const response = await request(app)
              .get(
                "/api/polls/00000000-0000-4000-8000-000000000000"
              )
              .expect(404);
        
            expect(response.body.message).toBe(
              "Poll not found"
            );
          });
});


});