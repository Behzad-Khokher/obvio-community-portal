package http

import (
	"net/http"
	"strconv"

	"github.com/behzad/obvio/internal/domain/annotation"
	"github.com/behzad/obvio/internal/usecase"
	"github.com/gin-gonic/gin"
)

type AnnotationHandler struct {
	uc *usecase.AnnotationUsecase
}

func NewAnnotationHandler(uc *usecase.AnnotationUsecase) *AnnotationHandler {
	return &AnnotationHandler{uc: uc}
}

// @Summary List annotations for an event
// @Tags annotations
// @Produce json
// @Param id path int true "Event ID"
// @Success 200 {array} annotation.Annotation
// @Router /events/{id}/annotations [get]
func (h *AnnotationHandler) List(c *gin.Context) {
	eventID, _ := strconv.Atoi(c.Param("id"))
	annotations, err := h.uc.ListAnnotations(uint(eventID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, annotations)
}

// @Summary Create an annotation for an event
// @Tags annotations
// @Accept json
// @Produce json
// @Param id path int true "Event ID"
// @Param annotation body annotation.Annotation true "Annotation data"
// @Success 201 {object} annotation.Annotation
// @Router /events/{id}/annotations [post]
func (h *AnnotationHandler) Create(c *gin.Context) {
	eventID, _ := strconv.Atoi(c.Param("id"))
	var a annotation.Annotation
	if err := c.ShouldBindJSON(&a); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	a.EventID = uint(eventID)
	if err := h.uc.CreateAnnotation(&a); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, a)
}

// @Summary Update an annotation
// @Tags annotations
// @Accept json
// @Produce json
// @Param id path int true "Annotation ID"
// @Param annotation body annotation.Annotation true "Annotation data"
// @Success 200 {object} annotation.Annotation
// @Router /annotations/{id} [put]
func (h *AnnotationHandler) Update(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	var input annotation.Annotation
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	updated, err := h.uc.UpdateAnnotation(uint(id), &input)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, updated)
}

// @Summary Delete an annotation
// @Tags annotations
// @Param id path int true "Annotation ID"
// @Success 204
// @Router /annotations/{id} [delete]
func (h *AnnotationHandler) Delete(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	if err := h.uc.DeleteAnnotation(uint(id)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.Status(http.StatusNoContent)
}
