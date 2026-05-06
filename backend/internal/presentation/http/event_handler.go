package http

import (
	"net/http"
	"strconv"

	"github.com/behzad/obvio/internal/domain/event"
	"github.com/behzad/obvio/internal/usecase"
	"github.com/gin-gonic/gin"
)

type EventHandler struct {
	uc *usecase.EventUsecase
}

func NewEventHandler(uc *usecase.EventUsecase) *EventHandler {
	return &EventHandler{uc: uc}
}

// @Summary List events for a trial
// @Tags events
// @Produce json
// @Param id path int true "Trial ID"
// @Success 200 {array} event.Event
// @Router /trials/{id}/events [get]
func (h *EventHandler) List(c *gin.Context) {
	trialID, _ := strconv.Atoi(c.Param("id"))
	events, err := h.uc.ListEvents(uint(trialID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, events)
}

// @Summary Get event by ID
// @Tags events
// @Produce json
// @Param id path int true "Event ID"
// @Success 200 {object} event.Event
// @Router /events/{id} [get]
func (h *EventHandler) Get(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	e, err := h.uc.GetEvent(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "event not found"})
		return
	}
	c.JSON(http.StatusOK, e)
}

// @Summary Create an event for a trial
// @Tags events
// @Accept json
// @Produce json
// @Param id path int true "Trial ID"
// @Param event body event.Event true "Event data"
// @Success 201 {object} event.Event
// @Router /trials/{id}/events [post]
func (h *EventHandler) Create(c *gin.Context) {
	trialID, _ := strconv.Atoi(c.Param("id"))
	var e event.Event
	if err := c.ShouldBindJSON(&e); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	e.TrialID = uint(trialID)
	if err := h.uc.CreateEvent(&e); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, e)
}

// @Summary Update an event
// @Tags events
// @Accept json
// @Produce json
// @Param id path int true "Event ID"
// @Param event body event.Event true "Event data"
// @Success 200 {object} event.Event
// @Router /events/{id} [put]
func (h *EventHandler) Update(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	var input event.Event
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	updated, err := h.uc.UpdateEvent(uint(id), &input)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, updated)
}

// @Summary Delete an event
// @Tags events
// @Param id path int true "Event ID"
// @Success 204
// @Router /events/{id} [delete]
func (h *EventHandler) Delete(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	if err := h.uc.DeleteEvent(uint(id)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.Status(http.StatusNoContent)
}

// @Summary Upload video for an event
// @Tags events
// @Accept multipart/form-data
// @Produce json
// @Param id path int true "Event ID"
// @Param video formData file true "Video file"
// @Success 200 {object} map[string]string
// @Router /events/{id}/upload [post]
func (h *EventHandler) Upload(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	fileHeader, err := c.FormFile("video")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "video file required"})
		return
	}
	file, err := fileHeader.Open()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer file.Close()
	url, err := h.uc.UploadVideo(uint(id), file, fileHeader.Filename)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"video_url": url})
}
